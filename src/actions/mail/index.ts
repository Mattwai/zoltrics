"use server";

import { authConfig } from "@/lib/auth";
import { client } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import nodemailer from "nodemailer";
import emailService from "@/lib/email";

export const onGetAllCustomers = async (id: string) => {
  try {
    const customers = await client.user.findUnique({
      where: {
        id,
      },
      select: {
        subscription: {
          select: {
            credits: true,
            plan: true,
          },
        },
        domains: {
          select: {
            customer: {
              select: {
                id: true,
                email: true,
                Domain: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (customers) {
      return customers;
    }
  } catch (error) {}
};

export const onGetAllCampaigns = async (id: string) => {
  try {
    const campaigns = await client.user.findUnique({
      where: {
        id,
      },
      select: {
        campaign: {
          select: {
            name: true,
            id: true,
            customers: true,
            createdAt: true,
          },
        },
      },
    });

    if (campaigns) {
      return campaigns;
    }
  } catch (error) {
    console.log(error);
  }
};

export const onCreateMarketingCampaign = async (name: string) => {
  try {
    const session = await getServerSession(authConfig);
    if (!session || !session.user) return null;
    const campaign = await client.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        campaign: {
          create: {
            name,
          },
        },
      },
    });

    if (campaign) {
      return { status: 200, message: "You campaign was created" };
    }
  } catch (error) {
    console.log(error);
  }
};

export const onSaveEmailTemplate = async (
  template: string,
  campainId: string
) => {
  try {
    const newTemplate = await client.campaign.update({
      where: {
        id: campainId,
      },
      data: {
        template,
      },
    });

    return { status: 200, message: "Email template created" };
  } catch (error) {
    console.log(error);
  }
};

export const onAddCustomersToEmail = async (
  customers: string[],
  id: string
) => {
  try {
    console.log(customers, id);
    const customerAdd = await client.campaign.update({
      where: {
        id,
      },
      data: {
        customers,
      },
    });

    if (customerAdd) {
      return { status: 200, message: "Customer added to campaign" };
    }
  } catch (error) {}
};

export const onBulkMailer = async (email: string[], campaignId: string) => {
  try {
    const session = await getServerSession(authConfig);
    if (!session || !session.user) return null;

    //get the template for this campaign
    const template = await client.campaign.findUnique({
      where: {
        id: campaignId,
      },
      select: {
        name: true,
        template: true,
      },
    });

    if (template && template.template) {
      // Use the centralized email service's bulk email method
      const emailResult = await emailService.sendBulkEmail({
        recipients: email,
        subject: template.name,
        content: JSON.parse(template.template),
        isHtml: false
      });
      
      if (!emailResult.success) {
        console.error('Failed to send bulk emails:', emailResult.error);
        return { status: 500, message: "Failed to send campaign emails" };
      }

      // Update credits in user account
      const creditsUsed = await client.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          subscription: {
            update: {
              credits: { decrement: email.length },
            },
          },
        },
      });
      
      if (creditsUsed) {
        return { 
          status: 200, 
          message: `Campaign emails sent to ${emailResult.sentCount} recipients` 
        };
      }
    }
    
    return { status: 404, message: "Campaign template not found" };
  } catch (error) {
    console.error('Error in bulk mailer:', error);
    return { status: 500, message: "An error occurred sending campaign emails" };
  }
};

export const onGetAllCustomerResponses = async (id: string) => {
  try {
    const session = await getServerSession(authConfig);
    if (!session || !session.user) return null;
    const answers = await client.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        domains: {
          select: {
            customer: {
              select: {
                questions: {
                  where: {
                    customerId: id,
                    answered: {
                      not: null,
                    },
                  },
                  select: {
                    question: true,
                    answered: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (answers) {
      return answers.domains;
    }
  } catch (error) {
    console.log(error);
  }
};

export const onGetEmailTemplate = async (id: string) => {
  try {
    const template = await client.campaign.findUnique({
      where: {
        id,
      },
      select: {
        template: true,
      },
    });

    if (template) {
      return template.template;
    }
  } catch (error) {
    console.log(error);
  }
};

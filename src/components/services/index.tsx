import { getMonthName } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { SideSheet } from "../sheet";
import { DataTable } from "../table";
import TabsMenu from "../tabs/index";
import { TableCell, TableRow } from "../ui/table";
import { TabsContent } from "../ui/tabs";
import { CreateServiceForm } from "./service-form";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";
import { onDeleteService, onUpdateServiceStatus } from "@/actions/settings";

type Props = {
  id: string;
  services: {
    id: string;
    name: string;
    createdAt: Date;
    pricing?: {
      price: number;
    } | null;
    status?: {
      isLive: boolean;
    } | null;
  }[];
  onServiceAdded?: () => void;
};

const service_header = ["Name", "Price (NZD)", "Status", "Created", "Actions"]

const ServiceTable = ({ id, services, onServiceAdded }: Props) => {
  const { toast } = useToast();
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return {
      day: dateObj.getDate(),
      month: dateObj.getMonth(),
      year: dateObj.getFullYear()
    };
  };

  const handleStatusChange = async (serviceId: string, isLive: boolean) => {
    try {
      const result = await onUpdateServiceStatus(serviceId, isLive);
      if (result?.status === 200) {
        onServiceAdded?.();
        toast({
          title: "Success",
          description: result?.message || "Failed to update service status",
        });
      }
    } catch (error) {
      console.error("Error updating service status:", error);
      toast({
        title: "Error",
        description: "Failed to update service status",
      });
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) {
      return;
    }
    try {
      const result = await onDeleteService(serviceId);
      if (result?.status === 200) {
        onServiceAdded?.();
        toast({
          title: "Success",
          description: result?.message || "Failed to delete service",
        });
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        title: "Error",
        description: "Failed to delete service",
      });
    }
  };

  const filteredServices = {
    all: services,
    live: services.filter(s => s.status?.isLive),
    deactivated: services.filter(s => !s.status?.isLive),
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-gray-100 p-3 mb-4">
        <Plus className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">No services found</h3>
      <p className="text-sm text-gray-500 mb-4">Get started by adding your first service</p>
      <SideSheet
        description="Add services to your store and set them live to accept payments from customers."
        title="Add a service"
        className="inline-flex items-center gap-2 bg-purple px-4 py-2 text-white font-semibold rounded-lg text-sm hover:bg-purple/90 transition-colors"
        trigger={
          <>
            <Plus size={20} />
            <span>Add Service</span>
          </>
        }
      >
        <CreateServiceForm id={id} onServiceAdded={onServiceAdded} />
      </SideSheet>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Services</h2>
          <p className="mt-1 text-sm text-gray-500">
            Add services to your store and set them live to accept payments from customers.
          </p>
        </div>
        <SideSheet
          description="Add services to your store and set them live to accept payments from customers."
          title="Add a service"
          className="inline-flex items-center gap-2 bg-purple px-4 py-2 text-white font-semibold rounded-lg text-sm hover:bg-purple/90 transition-colors"
          trigger={
            <>
              <Plus size={20} />
              <span>Add Service</span>
            </>
          }
        >
          <CreateServiceForm id={id} onServiceAdded={onServiceAdded} />
        </SideSheet>
      </div>

      <TabsMenu
        className="w-full"
        triggers={[
          {
            label: "All services",
            count: filteredServices.all.length,
          },
          { 
            label: "Live",
            count: filteredServices.live.length,
          },
          { 
            label: "Deactivated",
            count: filteredServices.deactivated.length,
          },
        ]}
      >
        <TabsContent value="All services">
          {filteredServices.all.length === 0 ? (
            <EmptyState />
          ) : (
            <DataTable headers={service_header}>
              {filteredServices.all.map((service) => {
                const date = formatDate(service.createdAt);
                return (
                  <TableRow key={service.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>${(service.pricing?.price ?? 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={service.status?.isLive ?? false}
                          onCheckedChange={(checked) => handleStatusChange(service.id, checked)}
                          className="data-[state=checked]:bg-purple data-[state=unchecked]:bg-gray-200"
                        />
                        <span className="text-sm text-gray-500">
                          {service.status?.isLive ? "Live" : "Draft"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {date.day} {getMonthName(date.month)} {date.year}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(service.id)}
                        className="hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </DataTable>
          )}
        </TabsContent>
        <TabsContent value="Live">
          {filteredServices.live.length === 0 ? (
            <EmptyState />
          ) : (
            <DataTable headers={service_header}>
              {filteredServices.live.map((service) => {
                const date = formatDate(service.createdAt);
                return (
                  <TableRow key={service.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>${(service.pricing?.price ?? 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={service.status?.isLive ?? false}
                          onCheckedChange={(checked) => handleStatusChange(service.id, checked)}
                          className="data-[state=checked]:bg-purple data-[state=unchecked]:bg-gray-200"
                        />
                        <span className="text-sm text-gray-500">
                          {service.status?.isLive ? "Live" : "Draft"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {date.day} {getMonthName(date.month)} {date.year}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(service.id)}
                        className="hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </DataTable>
          )}
        </TabsContent>
        <TabsContent value="Deactivated">
          {filteredServices.deactivated.length === 0 ? (
            <EmptyState />
          ) : (
            <DataTable headers={service_header}>
              {filteredServices.deactivated.map((service) => {
                const date = formatDate(service.createdAt);
                return (
                  <TableRow key={service.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>${(service.pricing?.price ?? 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={service.status?.isLive ?? false}
                          onCheckedChange={(checked) => handleStatusChange(service.id, checked)}
                          className="data-[state=checked]:bg-purple data-[state=unchecked]:bg-gray-200"
                        />
                        <span className="text-sm text-gray-500">
                          {service.status?.isLive ? "Live" : "Draft"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {date.day} {getMonthName(date.month)} {date.year}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(service.id)}
                        className="hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </DataTable>
          )}
        </TabsContent>
      </TabsMenu>
    </div>
  );
};

export default ServiceTable;

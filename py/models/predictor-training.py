import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import pickle

# Set random seed for reproducibility
np.random.seed(42)

# Step 1: Generate synthetic dataset for 1,000 bookings
n_samples = 1000
data = {
    'cancellations': np.random.randint(0, 6, n_samples),  # 0-5 cancellations
    'days_since_last_booking': np.random.randint(0, 366, n_samples),  # 0-365 days
    'is_evening': np.random.choice([0, 1], n_samples, p=[0.7, 0.3]),  # 30% evening
    'is_rainy': np.random.choice([0, 1], n_samples, p=[0.7, 0.3]),  # 30% rainy (NZ context)
    'is_holiday': np.random.choice([0, 1], n_samples, p=[0.95, 0.05]),  # 5% holiday
    'booking_lead_time': np.random.randint(0, 31, n_samples),  # 0-30 days
    'client_reliability': np.random.uniform(0, 1, n_samples),  # 0-1 score
    'is_first_appointment': np.random.choice([0, 1], n_samples, p=[0.8, 0.2]),  # 20% first
    'temperature': np.random.uniform(5, 25, n_samples),  # 5-25°C
    'is_peak_traffic': np.random.choice([0, 1], n_samples, p=[0.8, 0.2]),  # 20% peak hours
}

# Simulate no-show probability with complex factors
no_show_prob = (
    0.15 +  # Base no-show rate
    0.3 * data['cancellations'] / 5 +  # Strong cancellation impact
    0.2 * data['is_rainy'] +  # Strong rain impact (NZ context)
    0.1 * data['is_holiday'] +  # Holiday impact
    0.05 * data['is_evening'] +  # Evening impact
    (-0.1 * data['booking_lead_time'] / 30) +  # Shorter lead time increases risk
    (-0.15 * data['client_reliability']) +  # Less reliable increases risk
    0.1 * data['is_first_appointment'] +  # First appointments riskier
    0.05 * (data['temperature'] < 10) +  # Cold weather increases risk
    0.05 * data['is_peak_traffic']  # Traffic increases risk
)

no_show_prob += np.random.normal(0, 0.05, n_samples)  # Add real-world noise
no_show_prob = np.clip(no_show_prob, 0, 0.9)
data['no_show'] = np.random.binomial(1, no_show_prob)

# Create DataFrame
df = pd.DataFrame(data)

# Step 2: Prepare features and target
features = [
    'cancellations', 'days_since_last_booking', 'is_evening', 'is_rainy', 'is_holiday',
    'booking_lead_time', 'client_reliability', 'is_first_appointment', 'temperature',
    'is_peak_traffic'
]
X = df[features]
y = df['no_show']

# Step 3: Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Step 4: Train Random Forest model
model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10)
model.fit(X_scaled, y)

# Step 5: Save model and scaler
with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)
with open('scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)
    
# Step 6: Evaluate model (basic accuracy check)
accuracy = model.score(X_scaled, y)
print(f"Model accuracy on synthetic data: {accuracy:.2f}")

# Step 7: Inspect feature importances
importances_df = pd.DataFrame({
    'Feature': features,
    'Importance': model.feature_importances_
})
print("\nFeature Importances:")
print(importances_df.sort_values(by='Importance', ascending=False))

# Step 8: Validate multiple test cases
test_cases = [
    {
        'cancellations': 3, 'days_since_last_booking': 30, 'is_evening': 1, 'is_rainy': 1,
        'is_holiday': 1, 'booking_lead_time': 2, 'client_reliability': 0.5,
        'is_first_appointment': 1, 'temperature': 8, 'is_peak_traffic': 1,
        'desc': 'High risk: 3 cancellations, rainy, holiday, short lead, low reliability, cold, traffic'
    },
    {
        'cancellations': 2, 'days_since_last_booking': 30, 'is_evening': 1, 'is_rainy': 1,
        'is_holiday': 0, 'booking_lead_time': 5, 'client_reliability': 0.7,
        'is_first_appointment': 0, 'temperature': 15, 'is_peak_traffic': 0,
        'desc': 'Moderate risk: 2 cancellations, rainy, evening'
    },
    {
        'cancellations': 0, 'days_since_last_booking': 10, 'is_evening': 0, 'is_rainy': 0,
        'is_holiday': 0, 'booking_lead_time': 10, 'client_reliability': 0.9,
        'is_first_appointment': 0, 'temperature': 20, 'is_peak_traffic': 0,
        'desc': 'Low risk: No cancellations, clear day, reliable client'
    },
    {
        'cancellations': 4, 'days_since_last_booking': 60, 'is_evening': 0, 'is_rainy': 1,
        'is_holiday': 0, 'booking_lead_time': 3, 'client_reliability': 0.4,
        'is_first_appointment': 1, 'temperature': 10, 'is_peak_traffic': 1,
        'desc': 'High risk: 4 cancellations, rainy, short lead, low reliability, traffic'
    }
]
print("\nTest Case Risk Scores:")
for case in test_cases:
    sample = pd.DataFrame([case], columns=features)
    sample_scaled = scaler.transform(sample)
    risk_score = model.predict_proba(sample_scaled)[0][1] * 100
    print(f"{case['desc']}: {risk_score:.1f} {'(Deposit required)' if risk_score > 50 else ''}")
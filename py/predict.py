import json
import pickle
import sys
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier

def load_model_and_scaler():
    with open('models/deposit-predictor-model.pkl', 'rb') as f:
        model = pickle.load(f)
    with open('models/deposit-predictor-scaler.pkl', 'rb') as f:
        scaler = pickle.load(f)
    return model, scaler

def predict_risk(features_dict):
    model, scaler = load_model_and_scaler()
    features = [
        'cancellations', 'days_since_last_booking', 'is_evening', 'is_rainy', 'is_holiday',
        'booking_lead_time', 'client_reliability', 'is_first_appointment', 'temperature',
        'is_peak_traffic'
    ]
    # Convert input to DataFrame
    sample = pd.DataFrame([features_dict], columns=features)
    # Scale features
    sample_scaled = scaler.transform(sample)
    # Predict probability of no-show (class 1)
    risk_score = model.predict_proba(sample_scaled)[0][1] * 100
    return risk_score

if __name__ == "__main__":
    # Read input JSON from stdin
    input_data = sys.stdin.read()
    try:
        features_dict = json.loads(input_data)
        risk_score = predict_risk(features_dict)
        # Output result as JSON
        print(json.dumps({"risk_score": risk_score}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
import json
import pickle
import sys
import os
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier

def load_model_and_scaler():
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, 'models', 'deposit-predictor-model.pkl')
    scaler_path = os.path.join(script_dir, 'models', 'deposit-predictor-scaler.pkl')
    
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    with open(scaler_path, 'rb') as f:
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
    try:
        # Read input JSON from command line argument
        features_dict = json.loads(sys.argv[1])
        risk_score = predict_risk(features_dict)
        # Output result as JSON
        print(json.dumps({"risk_score": risk_score}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
GOOGLE_PROJECT_ID=plated-shelter-347208
CLOUD_RUN_SERVICE=coinshift-assigment-instance-service
INSTANCE_CONNECTION_NAME=plated-shelter-347208:asia-south1:coinshift-assigment-instance
DB_USER=root
DB_PASS=Oiwv6MJN7EqxddC0
DB_NAME=test_DB

gcloud builds submit --tag grc.io/$GOOGLE_PROJECT_ID/$CLOUD_RUN_SERVICE \
    --project=$GOOGLE_PROJECT_ID

gcloud run deploy $CLOUD_RUN_SERVICE \
    --image grc.io/$GOOGLE_PROJECT_ID/$CLOUD_RUN_SERVICE \
    --add-cloudsql-instance $INSTANCE_CONNECTION_NAME \
    --update-env-vars INSTANCE_CONNECTION_NAME=$INSTANCE_CONNECTION_NAME,DB_PASS=$DB_PASS,DB_NAME=$DB_NAME,DB_USER=$DB_USER \
    --platform managed \
    --region asia-south1 \
    --allow-unauthenticated \
    --project=$GOOGLE_PROJECT_ID
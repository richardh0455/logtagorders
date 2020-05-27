# Logtag Orders
This is a Proof of Concept Order Management webapp I built for Logtag Recorders. They wanted to simplify the process of generating pdf invoices for clients and reports for the business.

It's a React webapp with AWS Cognito for user authentication - the app connects through to a Postgres RDS instance via a set of microservice APIs (see: https://github.com/richardh0455/logtag-apis)
The user can view/edit/create invoices, products, and customer details, as well as generate pdf invoices for customers. 
The app also has QuickSight integration for reporting on Sales data.

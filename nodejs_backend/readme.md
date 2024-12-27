# NodeJS Backend for CampusVibe Application

This is the first I am building. It will take some time.
Readme.md will also be updated as the work goes on.

## /login
Gets the user logged in with username and password.
Returns with access token in json format and refresh token in cookies

## /login/new
Gets the user sign up on this application with a unique username and unique
email address.
Username and Password should be in format, if not returns with a set of 
instructions to abide by
Checks if the email is valid and then sends a verification email on entered
email.

## /login/email
Makes the user's email verified and OK for /login to login the user

## /login/email/resend
Sends a new verification email on the user's email

## /logout
Logs out the user, the access token and refresh token becomes invalid and cannot
be used again. 
Removing those from the frontend, should be user's responsibility
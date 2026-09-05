# Bugfix Requirements Document

## Introduction

This bugfix addresses a critical login failure affecting Safari and iPhone users in the PKKMB attendance system. Safari blocks third-party cookies by default, preventing Supabase Auth session cookies from being stored. This causes a silent login failure where users enter correct credentials, click login, but experience a page refresh with cleared inputs and no error message. With 850+ registered students using iPhones and a production event tomorrow, this issue prevents a significant portion of users from accessing the system.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user on Safari/iPhone enters correct NIM and password and clicks "Login" THEN the system refreshes the page and clears input fields without showing any error message

1.2 WHEN Safari/iPhone blocks third-party cookies during Supabase auth.signInWithPassword THEN the system fails silently with no user feedback about the cookie issue

1.3 WHEN a Safari/iPhone user experiences login failure due to cookie blocking THEN the system does not detect or inform the user about the browser-specific issue

1.4 WHEN Safari/iPhone cookie blocking prevents session storage THEN the system does not provide actionable guidance on how to resolve the issue

### Expected Behavior (Correct)

2.1 WHEN a user on Safari/iPhone attempts to login and cookies are blocked THEN the system SHALL detect the Safari/iPhone browser and display a clear warning message about cookie settings

2.2 WHEN Safari/iPhone blocks third-party cookies during authentication THEN the system SHALL catch the error and show a user-friendly message explaining the cookie issue with actionable steps to enable cookies

2.3 WHEN a Safari/iPhone user experiences authentication failure due to cookie blocking THEN the system SHALL provide specific instructions (e.g., "Settings > Safari > Prevent Cross-Site Tracking: OFF")

2.4 WHEN Safari/iPhone cookie blocking prevents login THEN the system SHALL display the error message instead of silently refreshing the page

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user on desktop Chrome/Edge/Firefox enters correct credentials THEN the system SHALL CONTINUE TO authenticate successfully and redirect to the appropriate dashboard

3.2 WHEN a user enters incorrect NIM or password on any browser THEN the system SHALL CONTINUE TO show the appropriate error message ("NIM atau password salah")

3.3 WHEN a user enters invalid input (empty fields, NIM not found) on any browser THEN the system SHALL CONTINUE TO display field validation errors

3.4 WHEN authentication succeeds on any supported browser THEN the system SHALL CONTINUE TO retrieve user role and redirect based on role (admin or mahasiswa dashboard)

3.5 WHEN the login form is submitted on any browser THEN the system SHALL CONTINUE TO show loading spinner and disable the submit button during authentication

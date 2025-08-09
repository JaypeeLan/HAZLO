export enum ResponseMessages {
  // Validation messages
  INVALID_EMAIL = 'The email address you provided is invalid. Please provide a valid email.',
  INVALID_PHONE = 'The phone number you provided must be a valid 11-digit number.',
  INVALID_NAME = 'The name you provided must contain only letters and spaces.',
  INVALID_PASSWORD = 'The password you provided must be at least 6 characters and contain both letters and numbers.',
  MISSING_FIELD = 'One or more required fields are missing or empty.',
  INVALID_OTP = 'The OTP you provided is invalid or has expired. Please try again.',
  INVALID_CREDENTIALS = 'Invalid email, phone, or password provided.',
  INVALID_PROFILE_DATA = 'Invalid profile data provided. Please ensure all required fields are valid.',
  INVALID_RESET_TOKEN = 'The password reset token is invalid or has expired.',

  NO_USER = 'User not found. Please create an account',

  // Email verification messages
  EMAIL_SENT = 'A verification email has been sent to your email address. Please check your inbox.',
  EMAIL_VERIFY_SUCCESS = 'Your email has been successfully verified. Thank you!',
  EMAIL_VERIFY_ERROR = 'The verification code is invalid or has expired. Please request a new link.',
  EMAIL_ERROR = 'Error sending verification email. Please try again later.',

  // OTP-specific messages
  OTP_SENT = 'An OTP has been sent to your phone number. Please check your messages.',
  OTP_SEND_ERROR = 'Error sending OTP. Please try again later.',
  OTP_ERROR = 'Error  verifying OTP. Please try again later.',
  OTP_INVALID = 'Wrong OTP. Please try again.',
  OTP_VERIFY_SUCCESS = 'OTP verified successfully.',

  // Authentication messages
  USER_EXISTS = 'A user with this email or phone number already exists.',
  USER_NOT_FOUND = 'This user does not exist. Please check your credentials or register.',
  UNVERIFIED_ACCOUNT = 'Your account is not verified. Please verify your email or phone.',
  REGISTRATION_SUCCESS = 'Registration successful. Please verify your email and phone to continue.',
  REGISTRATION_ERROR = 'Error during registration. Please try again later.',
  LOGIN_SUCCESS = 'Login successful.',
  LOGIN_ERROR = 'Error during login. Please try again later.',
  NO_TOKEN = 'Authorization token is missing. Please log in to access this resource.',
  INVALID_TOKEN = 'Invalid or expired token. Please log in again.',
  WRONG_PASSWORD = 'Wrong password. Please try again',

  // Password reset messages
  RESET_TOKEN_SENT = 'A password reset token has been sent to your email or phone.',
  RESET_PASSWORD_ERROR = 'Error processing password reset. Please try again later.',
  PASSWORD_RESET_SUCCESS = 'Password reset successfully.',

  // Profile messages
  PROFILE_FETCHED = 'Profile fetched successfully.',
  PROFILE_CREATED = 'Profile created successfully.',
  PROFILE_UPDATED = 'Profile updated successfully.',
  PROFILE_ERROR = 'Error processing profile. Please try again later.',
  PROFILE_EXISTS = 'Profile already exists for this user.',
  UNAUTHORIZED = 'You are not authorized to perform this action.',

  // orders
  ORDERS_FETCHED = 'Orders fetched successfully',
  ORDERS_FETCH_FAILED = 'Failed to fetch orders. Please try again.',
  ORDER_CREATED = 'Order created successfully',
  ORDER_CREATE_FAILED = 'Failed to create order',

  //payment
  PAYMENT_SUCCESS = 'Payment successful',
  PAYMENT_FAILED = 'Payment failed. Please try again.',
}

export enum LogMessages {
  // OTP-specific logs
  SENT_OTP = 'sent an OTP',
  VERIFIED_OTP = 'verified an OTP',

  // Email verification logs
  SENT_EMAIL_VERIFICATION = 'sent an email verification',
  VERIFIED_EMAIL = 'verified an email',

  // Authentication logs
  USER_REGISTERED = 'registered a new user',
  LOGIN = 'logged in',
  LOGOUT = 'logged out',
  PASSWORD_RESET_SENT = 'sent password reset token',
  PASSWORD_RESET_SUCCESS = 'password reset completed',

  // Profile logs
  PROFILE_CREATED = 'created a profile',
  PROFILE_UPDATED = 'updated a profile',

  USER_LOGGED_IN = 'login successful',
}

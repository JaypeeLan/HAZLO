export enum ResponseMessages {
  // Validation messages
  INVALID_EMAIL = 'The email address you provided is invalid. Please provide a valid email.',
  INVALID_PHONE = 'The phone number you provided must be a valid 11-digit number.',
  INVALID_NAME = 'The name you provided must contain only letters and spaces.',
  INVALID_PASSWORD = 'The password you provided must be at least 6 characters and contain both letters and numbers.',
  MISSING_FIELD = 'One or more required fields are missing or empty.',
  INVALID_OTP = 'The OTP you provided is invalid or has expired. Please try again.',

  // Email verification messages
  EMAIL_SENT = 'A verification email has been sent to your email address. Please check your inbox.',
  EMAIL_VERIFY_SUCCESS = 'Your email has been successfully verified. Thank you!',
  EMAIL_VERIFY_ERROR = 'The verification link is invalid or has expired. Please request a new link.',
  EMAIL_ERROR = 'Error sending verification email. Please try again later.',

  // OTP-specific messages
  OTP_SENT = 'An OTP has been sent to your phone number. Please check your messages.',
  OTP_ERROR = 'Error sending or verifying OTP. Please try again later.',
  OTP_INVALID = 'Wrong OTP. Please try again.',

  // Existing messages (from your provided enum, abbreviated for brevity)
  NO_TOKEN = 'Authorization token is missing. Please log in to access this resource.',
  INVALID_TOKEN = 'Invalid or expired token. Please log in again.',
  USER_NOT_FOUND = 'This user does not exist or is logged in elsewhere.',
}

export enum LogMessages {
  // OTP-specific logs
  SENT_OTP = 'sent an OTP',
  VERIFIED_OTP = 'verified an OTP',

  // Email verification logs
  SENT_EMAIL_VERIFICATION = 'sent an email verification',
  VERIFIED_EMAIL = 'verified an email',

  // Existing logs
  CREATED_ACCOUNT = 'created an account',
  LOGIN = 'logged in',
  LOGOUT = 'logged out',
}

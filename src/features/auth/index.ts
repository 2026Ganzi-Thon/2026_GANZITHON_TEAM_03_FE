export type * from './types'
export { GoogleIdentityButton } from './GoogleIdentityButton'
export { preloadGoogleSignIn } from './googleIdentity'
export { signInWithEmail, signOut } from './authApi'
export { createGoogleLoginChallenge, isGoogleSignupConsentRequired, signInWithGoogle } from './googleAuth'
export type { GoogleSignupConsent } from './googleAuth'
export type { SignupConsent } from './consent'
export { signUpWithEmail } from './emailSignupApi'
export { loginErrorMessage, signupErrorMessage, signupFailureMessages, signupFailureOf } from './authErrors'
export type { ConfirmFailure, PasswordResetFailure, SignupFailure } from './authErrors'
export { PASSWORD_MAX_LENGTH, PASSWORD_RULES, PASSWORD_RULE_TEXT, checkPassword, isValidPassword } from './password'
export type { PasswordRuleKey } from './password'
export {
  clearSignupDraft,
  getResendEmail,
  getSignupDraft,
  isSignupDraftExpired,
  markSignedUp,
  setSignupPassword,
} from './signupDraft'
export type { SignupDraft } from './signupDraft'
export { RESEND_COOLDOWN_SECONDS, VERIFICATION_LINK_MINUTES, useVerificationMail } from './useVerificationMail'
export { useEmailConfirmation } from './useEmailConfirmation'
export type { EmailConfirmationState } from './useEmailConfirmation'
export { usePasswordResetMail } from './usePasswordResetMail'
export { usePasswordReset } from './usePasswordReset'
export type { PasswordResetState } from './usePasswordReset'

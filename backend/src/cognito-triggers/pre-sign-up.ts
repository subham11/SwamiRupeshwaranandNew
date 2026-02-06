/**
 * PreSignUp Lambda Trigger
 *
 * Auto-confirms users and marks email as verified.
 * This allows OTP-authenticated users to be created without
 * requiring a separate confirmation step.
 *
 * For OTP flow: user is auto-created by backend if not found,
 * and this trigger ensures they're confirmed immediately.
 */

import type { PreSignUpTriggerEvent, PreSignUpTriggerHandler } from 'aws-lambda';

export const handler: PreSignUpTriggerHandler = async (
  event: PreSignUpTriggerEvent,
) => {
  console.log('PreSignUp trigger invoked', JSON.stringify({
    userName: event.userName,
    triggerSource: event.triggerSource,
    email: event.request.userAttributes?.email,
  }));

  // Auto-confirm user
  event.response.autoConfirmUser = true;

  // Auto-verify email (since we verified via OTP)
  if (event.request.userAttributes?.email) {
    event.response.autoVerifyEmail = true;
  }

  return event;
};

/**
 * DefineAuthChallenge Lambda Trigger
 *
 * Orchestrates the CUSTOM_AUTH flow for OTP-based passwordless login.
 * Cognito calls this trigger to determine the next step in authentication.
 *
 * Flow:
 *   1. First call → issue CUSTOM_CHALLENGE (triggers CreateAuthChallenge)
 *   2. User responds → if verified → mark authenticated
 *   3. If 3 failed attempts → deny access
 */

import type { DefineAuthChallengeTriggerEvent, DefineAuthChallengeTriggerHandler } from 'aws-lambda';

export const handler: DefineAuthChallengeTriggerHandler = async (
  event: DefineAuthChallengeTriggerEvent,
) => {
  console.log('DefineAuthChallenge invoked', JSON.stringify({
    userName: event.userName,
    session: event.request.session?.map(s => ({
      challengeName: s.challengeName,
      challengeResult: s.challengeResult,
    })),
  }));

  const session = event.request.session || [];

  // If user authenticated via SRP/PASSWORD flow (not custom), allow
  if (session.length > 0 && session[session.length - 1].challengeName === 'SRP_A') {
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
    event.response.challengeName = 'PASSWORD_VERIFIER';
    return event;
  }

  // No session yet → issue the first CUSTOM_CHALLENGE (send OTP)
  if (session.length === 0) {
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
    event.response.challengeName = 'CUSTOM_CHALLENGE';
    return event;
  }

  // Count failed CUSTOM_CHALLENGE attempts
  const failedAttempts = session.filter(
    (s) => s.challengeName === 'CUSTOM_CHALLENGE' && s.challengeResult === false,
  ).length;

  // Max 3 retry attempts → deny
  if (failedAttempts >= 3) {
    console.warn(`Max OTP attempts reached for user: ${event.userName}`);
    event.response.issueTokens = false;
    event.response.failAuthentication = true;
    return event;
  }

  // Check the most recent challenge result
  const lastSession = session[session.length - 1];

  if (
    lastSession.challengeName === 'CUSTOM_CHALLENGE' &&
    lastSession.challengeResult === true
  ) {
    // OTP verified successfully → issue tokens
    console.log(`OTP verified for user: ${event.userName}`);
    event.response.issueTokens = true;
    event.response.failAuthentication = false;
    return event;
  }

  // OTP was wrong → issue another challenge (retry)
  event.response.issueTokens = false;
  event.response.failAuthentication = false;
  event.response.challengeName = 'CUSTOM_CHALLENGE';

  return event;
};

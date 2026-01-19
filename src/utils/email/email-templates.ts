


export const verifyEmailTemplate = (link: string) => `
  <h2>Verify your email</h2>
  <p>Click the link below to verify your email address:</p>
  <a href="${link}">Verify Email</a>
  <p>This link expires in 24 hours.</p>
`;


export const resetPasswordTemplate = (link: string) => `
  <h2>Reset your password</h2>
  <p>Click the link below to reset your password:</p>
  <a href="${link}">Reset Password</a>
  <p>This link expires in 15 minutes.</p>
`;


export const inviteTemplate = ({
    inviterName,
    workspaceName,
    link,
}: {
    inviterName: string;
    workspaceName: string;
    link: string;
}) => `
  <h2>You’ve been invited to ${workspaceName}</h2>
  <p>${inviterName} invited you to join their workspace.</p>
  <a href="${link}">Accept Invitation</a>
`;

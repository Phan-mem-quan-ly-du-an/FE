import { CognitoIdentityProviderClient, ChangePasswordCommand } from "@aws-sdk/client-cognito-identity-provider";

export async function changePassword(
    accessToken: string,
    previousPassword: string,
    proposedPassword: string
): Promise<void> {
    const region = process.env.REACT_APP_COGNITO_REGION;
    if (!region) throw new Error("Missing AWS region (REACT_APP_COGNITO_REGION).");

    const client = new CognitoIdentityProviderClient({ region });
    const cmd = new ChangePasswordCommand({
        AccessToken: accessToken,
        PreviousPassword: previousPassword,
        ProposedPassword: proposedPassword,
    });
    await client.send(cmd);
}

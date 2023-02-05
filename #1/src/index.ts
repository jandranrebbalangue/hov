import { AccountEvents } from "../../events";

export function calculateAccountBalance(
  events: typeof AccountEvents,
  accountId: string
): number {
  let sum = 0;
  events.forEach((data) => {
    if (data.aggregateId === accountId && data.type === "BalanceCredited") {
      sum += data.body.amount as number;
    }
    if (data.aggregateId === accountId && data.type === "BalanceDebited") {
      sum -= data.body.amount as number;
    }
  });
  return sum;
}

export function getAccountInformation(
  events: typeof AccountEvents,
  accountId: string
) {
  const accountData = {};
  const accountCreated = events.find(
    (data) => data.aggregateId === accountId && data.type === "AccountCreated"
  );
  const accountUpdated = events.find(
    (data) => data.aggregateId === accountId && data.type === "AccountUpdated"
  );
  const accountWithdrawal = events.find(
    (data) =>
      data.body.account === accountId && data.type === "WithdrawalCreated"
  );
  const accountWithdrawalApproved = events.find(
    (data) =>
      data.aggregateId === accountWithdrawal?.aggregateId &&
      data.type === "WithdrawalApproved"
  );
  const accountDeposited = events.find(
    (data) => data.body.account === accountId && data.type === "DepositCreated"
  );

  const accountDepositApproved = events.find(
    (data) =>
      data.aggregateId === accountDeposited?.aggregateId &&
      data.type === "DepositApproved"
  );
  if (accountCreated) {
    accountData["email"] = accountCreated.body.email;
    accountData["fullName"] = accountCreated.body.fullName;
    accountData["password"] = accountCreated.body.password;
    accountData["username"] = accountCreated.body.username;
  }

  if (accountUpdated?.body.username)
    accountData["username"] = accountUpdated.body.username;
  if (accountUpdated?.body.fullName)
    accountData["fullName"] = accountUpdated.body?.fullName;
  if (accountUpdated?.body.email)
    accountData["email"] = accountUpdated.body?.email;

  if (accountUpdated?.body.password)
    accountData["password"] = accountUpdated.body?.password;

  if (accountDeposited && accountDepositApproved) {
    accountData["totalApprovedDepositAmount"] = accountDeposited.body.amount;
  }
  if (accountWithdrawal && accountWithdrawalApproved) {
    accountData["totalApprovedWithdrawalAmount"] =
      accountWithdrawal.body.amount;
  }
  if (!accountCreated) return null;
  return accountData;
}

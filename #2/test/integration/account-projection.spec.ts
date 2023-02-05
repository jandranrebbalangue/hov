import waitForExpect from "wait-for-expect";

import AccountProjection from "../../src/projection/account";

import { AccountEvents, AggregateType } from "../../../events";
import EventStore from "../../src/library/eventstore";
import { expect } from "chai";
import { AccountState } from "../../src/aggregate/account";
import { EventModel } from "../../../db";
import {
  calculateAccountBalance,
  getAccountInformation,
} from "../../../#1/src";

async function findById(id: string): Promise<{
  username: string;
  fullName: string;
  email: string;
  balance: number;
} | null> {
  // TODO: Implement this function to retrieve the account information by account id.
  const account = {};
  const events = await EventModel.find({ aggregateId: id }).exec();
  const accountWithdrawal = await EventModel.findOne({
    type: "WithdrawalCreated",
    "body.account": id,
  });
  const accountDeposited = await EventModel.findOne({
    type: "DepositCreated",
    "body.account": id,
  });

  const accountWithdrawalApproved = await EventModel.findOne({
    aggregateId: accountWithdrawal?.aggregateId,
    type: "WithdrawalApproved",
  });

  const accountDepositApproved = await EventModel.findOne({
    aggregateId: accountDeposited?.aggregateId,
    type: "DepositApproved",
  });

  const accountUpdated = events.find(
    (data) => data.aggregateId === id && data.type === "AccountUpdated"
  );

  if (accountWithdrawal && accountWithdrawalApproved) {
    account["totalApprovedWithdrawalAmount"] = accountWithdrawal.body.amount;
  }
  if (accountDeposited && accountDepositApproved) {
    account["totalApprovedDepositAmount"] = accountDeposited.body.amount;
  }

  const sum = calculateAccountBalance(events, id);

  const accountData = getAccountInformation(events, id) as AccountState;
  if (accountData) {
    account["email"] = accountData.email;
    account["fullName"] = accountData.fullName;
    account["username"] = accountData.username;
    if (accountUpdated) account["username"] = accountUpdated.body.username;
    account["balance"] = sum;
  }
  return account as AccountState;
}

describe("AccountProjection", function() {
  describe("#start", function() {
    before(async function() {
      await EventModel.deleteMany({});
      this.eventStore = new EventStore(AccountEvents);
      this.projection = new AccountProjection(this.eventStore);
      this.aggregateId = "60329145-ba86-44fb-8fc8-519e1e427a60";

      await this.projection.start();

      this.account = await findById(this.aggregateId);
    });

    after(async function() {
      const eventStore = new EventStore(AccountEvents);
      const projection = new AccountProjection(eventStore);
      await projection.stop();
      // TODO: Destroy test data/models
    });

    it("SHOULD project the data to the correctly to the database", function() {
      expect(this.account).to.deep.equal({
        username: "jdoe",
        fullName: "johndoe",
        email: "email@ml.com",
        balance: 23,
        totalApprovedWithdrawalAmount: 7,
        totalApprovedDepositAmount: 10,
      });
    });

    describe("WHEN there is a new event", function() {
      before(async function() {
        await this.eventStore.createEvent({
          aggregateType: AggregateType.Account,
          type: "BalanceDebited",
          aggregateId: this.aggregateId,
          body: { amount: 7 },
        });
      });

      it("SHOULD be able to apply new events to the model", async function() {
        await waitForExpect(async () => {
          const account = await findById(this.aggregateId);
          expect(account).to.have.property("balance", 23);
        });
      });
    });
  });
});

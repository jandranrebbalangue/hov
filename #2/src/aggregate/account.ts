import {
  AccountCreatedEvent,
  AccountUpdatedEvent,
  AggregateType,
  CreditedEvent,
  DebitEvent,
} from "../../../events";
import EventStore from "../library/eventstore";
import Aggregate from "../library/aggregate";
import {
  AccountAlreadyExistsError,
  AccountNotFoundError,
  InsufficientFundError,
} from "../library/errors";

export type Account = {
  username: string;
  fullName: string;
  password: string;
  email: string;
  balance: number;
};

export type AccountState = Account | null;

type AccountAggregateEvents =
  | AccountCreatedEvent
  | AccountUpdatedEvent
  | CreditedEvent
  | DebitEvent;

export default class AccountAggregate extends Aggregate<AccountState> {
  public static findById(id: string, eventStore: EventStore): AccountAggregate {
    const account = new AccountAggregate(id, eventStore);
    account.fold();
    return account;
  }

  public get aggregateType() {
    return AggregateType.Account;
  }

  constructor(id: string, eventStore: EventStore) {
    super(id, null, eventStore);
  }

  /**
   * This method will be called for each event that will be processed by the aggregate
   * that is from the eventstore.
   * @param event
   * @returns
   */
  protected apply(event: AccountAggregateEvents): AccountState {
    // TODO: Implement this method
    switch (event.type) {
      case "AccountCreated":
        if (this.state) {
          throw new AccountAlreadyExistsError(this.id);
        }
        return {
          username: event.body.username,
          fullName: event.body.fullName,
          password: event.body.password,
          email: event.body.email,
          balance: 0,
        };
      case "AccountUpdated":
        if (!this.state) {
          throw new AccountNotFoundError(this.id);
        }
        return {
          ...this.state,
          username: event.body?.username || this.state.username,
          fullName: event.body?.fullName || this.state.fullName,
          password: this.state?.password ,
          email: event.body?.email || this.state.email,
          balance: this.state?.balance ,
        };
      case "BalanceCredited":
        if (!this.state) {
          throw new AccountNotFoundError(this.id);
        }
        return {
          ...this.state,
          username: this.state?.username ,
          fullName: this.state?.fullName ,
          password: this.state?.password ,
          email: this.state?.email ,
          balance: this.state.balance + event.body.amount,
        };
      case "BalanceDebited":
        if (!this.state) {
          throw new AccountNotFoundError(this.id);
        }
        const currentBalance = this.state?.balance ;
        const eventAmount = event.body.amount ;
        if (eventAmount > currentBalance) {
          throw new InsufficientFundError(this.id);
        }
        return {
          ...this.state,
          username: this.state?.username ,
          fullName: this.state?.fullName ,
          password: this.state?.password ,
          email: this.state?.email ,
          balance: this.state.balance - event.body.amount,
        };
      default:
        return this.state;
    }
  }

  public static createAccount(
    id: string,
    info: Omit<Account, "balance">,
    eventStore: EventStore
  ) {
    const account = this.findById(id, eventStore);
    account.createEvent("AccountCreated", info);
    return id;
  }

  public updateAccount(info: Partial<Omit<Account, "balance">>) {
    this.createEvent("AccountUpdated", info);
    return true;
  }

  public creditBalance(amount: number) {
    this.createEvent("BalanceCredited", { amount });
    return true;
  }

  public debitBalance(amount: number) {
    this.createEvent("BalanceDebited", { amount });
    return true;
  }
}

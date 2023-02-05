import { connect, model, Schema, set, disconnect } from "mongoose";
import { AggregateType, Event as events } from "./events";
import { config } from "dotenv";

config();

const bodySchema = new Schema({
  username: { type: String, required: false },
  fullName: { type: String, required: false },
  password: { type: String, required: false },
  email: { type: String, required: false },
  account: { type: String, require: false },
  amount: { type: Number, required: false },
});
// 2. Create a Schema corresponding to the document interface.
const eventsSchema = new Schema<events>({
  aggregateType: {
    type: Number,
    required: true,
    enum: [
      AggregateType.Account,
      AggregateType.Deposit,
      AggregateType.Withdrawal,
    ],
  },
  aggregateId: { type: String, required: true },
  version: { type: Number, required: true },
  type: { type: String, required: true },
  body: { type: bodySchema, default: {}, required: true },
});

// 3. Create a Model.
export const EventModel = model<events>("Events", eventsSchema);
mongoConnect().catch((err) => console.log(err));

export async function mongoConnect(): Promise<void> {
  // 4. Connect to MongoDB
  set("strictQuery", true);
  const { MONGO_URL } = process.env;
  const url = MONGO_URL as string;
  await connect(url, {
    serverSelectionTimeoutMS: 15000,
  });
}
export async function mongoDisconnect(): Promise<void> {
  await disconnect();
}

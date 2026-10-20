// An error whose message is safe to show to the farmer in the chat.
export class ProviderError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

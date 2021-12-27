import BaseRedemption from "./base-redemption.js";

class DanceToASongRedemption extends BaseRedemption {
  constructor({ streamingService }) {
    const title = "dance to a song";

    super({ streamingService, title });

    this.data = {
      id: "f75ae948-4d4d-41a1-94c5-76315bc2bcb7",
      title,
      prompt:
        "you can suggest something, but i have the executive decision",
      cost: 5,
      background_color: "#C2F9FD",
      should_redemptions_skip_request_queue: false,
      is_user_input_required: true,
      isForDancing: true,
    };
  }
}

export default DanceToASongRedemption;

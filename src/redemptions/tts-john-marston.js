import BaseRedemption from "./base-redemption.js";

class JohnMarTTSonRedemption extends BaseRedemption {
  constructor({ streamingService }) {
    const title = "John MarTTSon";

    super({ streamingService, title });

    this.streamingService = streamingService;
    this.data = {
      id: "deeee2a9-383b-49c8-90b2-8b82ba758c5a",
      title,
      prompt:
        "Text-to-speach as John Marston. Might take a while be patient...",
      cost: 100,
      background_color: "#e90617",
      is_user_input_required: true,
      is_enabled: false, // temporarily disabled
    };
  }
}

export default JohnMarTTSonRedemption;

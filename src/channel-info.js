class ChannelInfo {
  constructor({ category, title } = {}) {
    this.category = category;
    this.title = title;
  }

  setCategory(category) {
    this.category = category;
  }

  setTitle(title) {
    this.title = title;
  }
}

export default ChannelInfo;

/**
 * PANGU Drag & Drop Ingestion Manager
 * Enables dragging images or code/text files directly onto Pangu's 3D body
 * to receive multimodal AI vision analysis and coding assistance.
 */

export class DragDropManager {
  constructor(options = {}) {
    this.hitBox = options.hitBox;
    this.pangu = options.pangu;
    this.panguAPI = options.panguAPI;
    this.soundFX = options.soundFX || window.soundFX;
    this.showSpeech = options.showSpeech || (() => {});
    this.refreshPetRpgUI = options.refreshPetRpgUI || (() => {});

    this.bindEvents();
  }

  bindEvents() {
    if (!this.hitBox) return;

    this.hitBox.addEventListener('dragenter', (e) => this.onDragEnter(e));
    this.hitBox.addEventListener('dragover', (e) => this.onDragOver(e));
    this.hitBox.addEventListener('dragleave', (e) => this.onDragLeave(e));
    this.hitBox.addEventListener('drop', (e) => this.onDrop(e));
  }

  onDragEnter(e) {
    e.preventDefault();
    if (this.panguAPI) this.panguAPI.setIgnoreMouseEvents(false);
    this.hitBox.classList.add('drag-hover');
    if (this.pangu) this.pangu.triggerHabit('CURIOSITY_PEEK');
    if (this.soundFX) this.soundFX.playPop();
  }

  onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    this.hitBox.classList.add('drag-hover');
  }

  onDragLeave(e) {
    this.hitBox.classList.remove('drag-hover');
  }

  async onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.hitBox.classList.remove('drag-hover');

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name);
    const isCodeOrText = /\.(js|jsx|ts|tsx|py|html|css|json|md|txt|cpp|c|java|cs|sql|rs|go|sh|bat)$/i.test(file.name);

    if (isImage) {
      await this.handleImageDrop(file);
    } else if (isCodeOrText) {
      await this.handleCodeDrop(file);
    } else {
      this.showSpeech(`Machi, file "${file.name}" drop panniruke! Thanks da! 🐾✨`, 3500, 'happy');
      if (this.pangu) this.pangu.reactTouch();
      if (this.panguAPI) this.panguAPI.addXp(15);
      this.refreshPetRpgUI();
    }
  }

  handleImageDrop(file) {
    return new Promise((resolve) => {
      this.showSpeech(`Analyzing image "${file.name}" with multimodal vision... 👀✨`, 3500, 'normal');
      if (this.pangu) {
        this.pangu.setThinking(true);
        this.pangu.triggerHabit('SURVEY_DESKTOP');
      }
      if (this.soundFX) this.soundFX.playLaserPing();

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result;
          const prompt = `User dropped an image named '${file.name}' directly onto your 3D body! Inspect this image carefully and give witty, friendly, brotherly feedback or review in authentic Tanglish (2 to 4 sentences). Include [ACTION:tag]!`;
          const response = await this.panguAPI.sendVisionMessage(prompt, base64Data);
          if (this.pangu) this.pangu.setThinking(false);

          this.showSpeech(response.text, 0, 'excited');
          if (this.pangu) this.pangu.reactCelebrate();
          if (this.panguAPI) this.panguAPI.addXp(30);
          this.refreshPetRpgUI();
        } catch (err) {
          if (this.pangu) this.pangu.setThinking(false);
          this.showSpeech(`Image "${file.name}"-ah analyze panna mudiyala machi! Check API key!`, 4000);
        }
        resolve();
      };
      reader.onerror = () => {
        if (this.pangu) this.pangu.setThinking(false);
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }

  handleCodeDrop(file) {
    return new Promise((resolve) => {
      this.showSpeech(`Reviewing code in "${file.name}"... 💻🐾`, 3500, 'normal');
      if (this.pangu) {
        this.pangu.setThinking(true);
        this.pangu.triggerHabit('CURIOSITY_PEEK');
      }
      if (this.soundFX) this.soundFX.playPop();

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const text = (reader.result || '').slice(0, 3000);
          const prompt = `User dropped a code/text file named '${file.name}' directly onto your 3D body! Here is the file content:\n\`\`\`\n${text}\n\`\`\`\nReview this code like a genius coding buddy sitting on their desk! Give quick, witty, brotherly tips, praise, or bug fixes in natural Tanglish (2 to 4 sentences). Include [ACTION:tag]!`;
          const response = await this.panguAPI.sendMessage(prompt);
          if (this.pangu) this.pangu.setThinking(false);

          this.showSpeech(response.text, 0, 'excited');
          if (this.pangu) this.pangu.reactCelebrate();
          if (this.panguAPI) this.panguAPI.addXp(30);
          this.refreshPetRpgUI();
        } catch (err) {
          if (this.pangu) this.pangu.setThinking(false);
          this.showSpeech(`Code file "${file.name}"-ah padikka mudiyala da!`, 4000);
        }
        resolve();
      };
      reader.onerror = () => {
        if (this.pangu) this.pangu.setThinking(false);
        resolve();
      };
      reader.readAsText(file);
    });
  }
}

class Logger {
  static log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = this.getPrefix(type);
    console.log(`${prefix} ${message}`);
  }

  static info(message) {
    this.log(message, 'info');
  }

  static success(message) {
    this.log(message, 'success');
  }

  static warning(message) {
    this.log(message, 'warning');
  }

  static error(message) {
    this.log(message, 'error');
  }

  static debug(message) {
    this.log(message, 'debug');
  }

  static getPrefix(type) {
    const prefixes = {
      info: '📋',
      success: '✅',
      warning: '⚠️ ',
      error: '❌',
      debug: '🔍'
    };
    return prefixes[type] || '📋';
  }

  static progress(current, total, message = '') {
    const percentage = Math.round((current / total) * 100);
    const progressBar = '='.repeat(Math.floor(percentage / 5));
    const spaces = ' '.repeat(20 - progressBar.length);
    console.log(`📊 [${progressBar}${spaces}] ${percentage}% ${message}`);
  }

  static section(title) {
    console.log('\n' + '='.repeat(60));
    console.log(`🔍 ${title}`);
    console.log('='.repeat(60));
  }

  static subsection(title) {
    console.log(`\n🔍 ${title}`);
    console.log('-'.repeat(40));
  }
}

module.exports = Logger; 
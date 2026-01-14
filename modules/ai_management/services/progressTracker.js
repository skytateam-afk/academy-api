/**
 * Progress Tracker
 * In-memory progress tracking for long-running tasks
 */

class ProgressTracker {
  constructor() {
    // Store progress by job ID: { progress: number, total: number, status: string, message: string }
    this.progressMap = new Map();
  }

  /**
   * Initialize progress for a job
   * @param {string} jobId - Unique job identifier
   * @param {number} total - Total number of items to process
   */
  initProgress(jobId, total) {
    this.progressMap.set(jobId, {
      progress: 0,
      total: total,
      percentage: 0,
      status: 'processing',
      message: 'Initializing...',
      startTime: Date.now(),
    });
  }

  /**
   * Update progress for a job
   * @param {string} jobId - Unique job identifier
   * @param {number} progress - Current progress count
   * @param {string} message - Optional status message
   */
  updateProgress(jobId, progress, message = null) {
    const job = this.progressMap.get(jobId);
    if (!job) return;

    job.progress = progress;
    job.percentage = Math.round((progress / job.total) * 100);
    if (message) {
      job.message = message;
    }

    this.progressMap.set(jobId, job);
  }

  /**
   * Complete a job
   * @param {string} jobId - Unique job identifier
   * @param {string} message - Completion message
   */
  completeProgress(jobId, message = 'Completed') {
    const job = this.progressMap.get(jobId);
    if (!job) return;

    job.progress = job.total;
    job.percentage = 100;
    job.status = 'completed';
    job.message = message;
    job.endTime = Date.now();

    this.progressMap.set(jobId, job);

    // Clean up after 5 minutes
    setTimeout(() => {
      this.progressMap.delete(jobId);
    }, 5 * 60 * 1000);
  }

  /**
   * Fail a job
   * @param {string} jobId - Unique job identifier
   * @param {string} error - Error message
   */
  failProgress(jobId, error) {
    const job = this.progressMap.get(jobId);
    if (!job) return;

    job.status = 'failed';
    job.message = error;
    job.endTime = Date.now();

    this.progressMap.set(jobId, job);

    // Clean up after 5 minutes
    setTimeout(() => {
      this.progressMap.delete(jobId);
    }, 5 * 60 * 1000);
  }

  /**
   * Get progress for a job
   * @param {string} jobId - Unique job identifier
   * @returns {Object|null} - Progress object or null if not found
   */
  getProgress(jobId) {
    return this.progressMap.get(jobId) || null;
  }

  /**
   * Check if job exists
   * @param {string} jobId - Unique job identifier
   * @returns {boolean}
   */
  hasJob(jobId) {
    return this.progressMap.has(jobId);
  }
}

// Singleton instance
const progressTracker = new ProgressTracker();

module.exports = progressTracker;

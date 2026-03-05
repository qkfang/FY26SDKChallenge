import { spawn, ChildProcess } from 'child_process';

export interface WorkIQQueryResult {
  query: string;
  answer: string;
  success: boolean;
}

export class WorkIQService {
  private tenantId: string | undefined;

  setTenantId(tenantId: string): void {
    this.tenantId = tenantId;
    console.log(`Work IQ tenant set: ${tenantId}`);
  }

  getMcpServerConfig(): { command: string; args: string[] } {
    const args = ['-y', '@microsoft/workiq', 'mcp'];
    if (this.tenantId) {
      args.push('-t', this.tenantId);
    }
    return { command: 'npx', args };
  }

  async ask(question: string): Promise<WorkIQQueryResult> {
    const args = ['-y', '@microsoft/workiq', 'ask', '-q', question];
    if (this.tenantId) {
      args.push('-t', this.tenantId);
    }

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';

      const proc: ChildProcess = spawn('npx', args, {
        shell: true,
        env: { ...process.env },
      });

      proc.stdout?.on('data', (data: Buffer) => { stdout += data.toString(); });
      proc.stderr?.on('data', (data: Buffer) => { stderr += data.toString(); });

      const timeout = setTimeout(() => {
        proc.kill();
        resolve({ query: question, answer: 'Work IQ query timed out after 60s', success: false });
      }, 60000);

      proc.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0 && stdout.trim()) {
          resolve({ query: question, answer: stdout.trim(), success: true });
        } else {
          resolve({
            query: question,
            answer: stderr.trim() || stdout.trim() || `Work IQ exited with code ${code}`,
            success: false,
          });
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timeout);
        resolve({ query: question, answer: `Work IQ process error: ${err.message}`, success: false });
      });
    });
  }
}

export const workiqService = new WorkIQService();

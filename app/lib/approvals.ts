import { randomUUID } from 'crypto';

export interface ApprovalRequest {
  id: string;
  workflowId: string;
  workflowName: string;
  action: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  expiresAt?: Date;
  requestedBy?: string;
  requestedByEmail?: string;
  comment?: string;
  metadata?: Record<string, unknown>;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface ApprovalConfig {
  workflowName: string;
  action: string;
  description: string;
  requestedBy?: string;
  requestedByEmail?: string;
  expiresInMinutes?: number;
  metadata?: Record<string, unknown>;
}

class ApprovalStore {
  private approvals: Map<string, ApprovalRequest> = new Map();
  private webhooks: Map<string, { resolve: (data: ApprovalResponse) => void; reject: (error: Error) => void }> = new Map();

  create(config: ApprovalConfig): { approval: ApprovalRequest; webhookUrl: string } {
    const approvalId = randomUUID();
    const webhookToken = randomUUID();
    
    const approval: ApprovalRequest = {
      id: approvalId,
      workflowId: randomUUID(),
      workflowName: config.workflowName,
      action: config.action,
      description: config.description,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: config.expiresInMinutes 
        ? new Date(Date.now() + config.expiresInMinutes * 60 * 1000) 
        : undefined,
      requestedBy: config.requestedBy,
      requestedByEmail: config.requestedByEmail,
      metadata: config.metadata,
    };

    this.approvals.set(approvalId, approval);
    
    const webhookUrl = `/api/approvals/${approvalId}/webhook`;
    
    return { approval, webhookUrl };
  }

  async waitForApproval(approvalId: string, timeoutMs?: number): Promise<ApprovalResponse> {
    return new Promise((resolve, reject) => {
      const approval = this.approvals.get(approvalId);
      
      if (!approval) {
        reject(new Error(`Approval ${approvalId} not found`));
        return;
      }

      if (approval.status !== 'pending') {
        reject(new Error(`Approval ${approvalId} is already ${approval.status}`));
        return;
      }

      if (timeoutMs) {
        const timeout = setTimeout(() => {
          this.webhooks.delete(approvalId);
          reject(new Error(`Approval ${approvalId} timed out`));
        }, timeoutMs);
        
        this.webhooks.set(approvalId, {
          resolve: (data) => {
            clearTimeout(timeout);
            resolve(data);
          },
          reject: (error) => {
            clearTimeout(timeout);
            reject(error);
          },
        });
      } else {
        this.webhooks.set(approvalId, { resolve, reject });
      }
    });
  }

  async approve(
    approvalId: string, 
    comment?: string, 
    resolvedBy?: string
  ): Promise<ApprovalRequest> {
    const approval = this.approvals.get(approvalId);
    
    if (!approval) {
      throw new Error(`Approval ${approvalId} not found`);
    }

    if (approval.status !== 'pending') {
      throw new Error(`Approval ${approvalId} is already ${approval.status}`);
    }

    approval.status = 'approved';
    approval.comment = comment;
    approval.resolvedAt = new Date();
    approval.resolvedBy = resolvedBy;

    const webhook = this.webhooks.get(approvalId);
    if (webhook) {
      webhook.resolve({ approved: true, comment });
      this.webhooks.delete(approvalId);
    }

    return approval;
  }

  async reject(
    approvalId: string, 
    comment?: string, 
    resolvedBy?: string
  ): Promise<ApprovalRequest> {
    const approval = this.approvals.get(approvalId);
    
    if (!approval) {
      throw new Error(`Approval ${approvalId} not found`);
    }

    if (approval.status !== 'pending') {
      throw new Error(`Approval ${approvalId} is already ${approval.status}`);
    }

    approval.status = 'rejected';
    approval.comment = comment;
    approval.resolvedAt = new Date();
    approval.resolvedBy = resolvedBy;

    const webhook = this.webhooks.get(approvalId);
    if (webhook) {
      webhook.resolve({ approved: false, comment });
      this.webhooks.delete(approvalId);
    }

    return approval;
  }

  get(approvalId: string): ApprovalRequest | undefined {
    return this.approvals.get(approvalId);
  }

  getAll(filters?: {
    status?: ApprovalRequest['status'];
    workflowName?: string;
  }): ApprovalRequest[] {
    let approvals = Array.from(this.approvals.values());

    if (filters?.status) {
      approvals = approvals.filter(a => a.status === filters.status);
    }

    if (filters?.workflowName) {
      approvals = approvals.filter(a => a.workflowName === filters.workflowName);
    }

    return approvals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getPending(): ApprovalRequest[] {
    return this.getAll({ status: 'pending' });
  }

  delete(approvalId: string): boolean {
    return this.approvals.delete(approvalId);
  }

  clearResolved(): number {
    let count = 0;
    for (const [id, approval] of this.approvals) {
      if (approval.status !== 'pending') {
        this.approvals.delete(id);
        count++;
      }
    }
    return count;
  }
}

export interface ApprovalResponse {
  approved: boolean;
  comment?: string;
}

export const approvalStore = new ApprovalStore();

export async function requestApproval(config: ApprovalConfig): Promise<{
  approvalId: string;
  webhookUrl: string;
}> {
  const { approval, webhookUrl } = approvalStore.create(config);
  return { approvalId: approval.id, webhookUrl };
}

export async function waitForApproval(
  approvalId: string, 
  timeoutMs?: number
): Promise<ApprovalResponse> {
  return approvalStore.waitForApproval(approvalId, timeoutMs);
}

export async function approveRequest(
  approvalId: string, 
  comment?: string, 
  resolvedBy?: string
): Promise<ApprovalRequest> {
  return approvalStore.approve(approvalId, comment, resolvedBy);
}

export async function rejectRequest(
  approvalId: string, 
  comment?: string, 
  resolvedBy?: string
): Promise<ApprovalRequest> {
  return approvalStore.reject(approvalId, comment, resolvedBy);
}

export function getApproval(approvalId: string): ApprovalRequest | undefined {
  return approvalStore.get(approvalId);
}

export function getPendingApprovals(): ApprovalRequest[] {
  return approvalStore.getPending();
}

export function getAllApprovals(
  filters?: { status?: ApprovalRequest['status']; workflowName?: string }
): ApprovalRequest[] {
  return approvalStore.getAll(filters);
}

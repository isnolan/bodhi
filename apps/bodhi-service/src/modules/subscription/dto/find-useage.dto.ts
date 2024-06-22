interface Usage {
  id: number;
  quota_id: number;
  consumed: number;
}

export interface UsageWithQuota extends Usage {
  quota: {
    id: number;
    type: string;
    quotas: number;
  };
}

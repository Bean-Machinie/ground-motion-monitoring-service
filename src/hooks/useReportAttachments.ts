// Fetches the attachments belonging to one report. RLS scopes access
// through the owning report's org. Primary first, then admin sort order.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import type { ReportAttachment } from "@/types/domain";

interface UseReportAttachmentsState {
  attachments: ReportAttachment[];
  loading: boolean;
  error: string | null;
}

export function useReportAttachments(
  reportId: string | undefined,
): UseReportAttachmentsState & { refetch: () => void } {
  const [state, setState] = useState<UseReportAttachmentsState>({
    attachments: [],
    loading: true,
    error: null,
  });

  const fetchAttachments = useCallback(async () => {
    if (!reportId) {
      setState({ attachments: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data, error } = await supabase
        .from("report_attachments")
        .select("*")
        .eq("report_id", reportId)
        .order("is_primary", { ascending: false })
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      setState({ attachments: data ?? [], loading: false, error: null });
    } catch (err) {
      setState({
        attachments: [],
        loading: false,
        error: getErrorMessage(err),
      });
    }
  }, [reportId]);

  useEffect(() => {
    void fetchAttachments();
  }, [fetchAttachments]);

  return { ...state, refetch: fetchAttachments };
}

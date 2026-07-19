// Expert-assisted request submission. Two sequential steps, and the
// distinction matters for how failures are reported:
//   1. Persist the request as an `expert_assisted_requests` row — the
//      submission is safe once this succeeds.
//   2. Invoke the `send-expert-request-email` edge function to notify
//      the specialist team.
// If step 2 fails after step 1 succeeded, we throw a deliberately
// reassuring message: the data was saved, only the notification pipeline
// is broken. Never conflate that with a lost submission.
import { supabase } from "@/lib/supabase";

export interface ExpertAssistedRequestPayload {
  name: string;
  email: string;
  organization: string;
  projectAreaDescription: string;
  projectObjective: string;
  preferredOutputFormat: string;
  comments: string;
}

export async function submitExpertAssistedRequest(
  payload: ExpertAssistedRequestPayload,
): Promise<void> {
  const { error: insertError } = await supabase
    .from("expert_assisted_requests")
    .insert({
      name: payload.name,
      email: payload.email,
      organization: payload.organization,
      project_area_description: payload.projectAreaDescription,
      project_objective: payload.projectObjective,
      preferred_output_format: payload.preferredOutputFormat,
      comments: payload.comments,
    });
  if (insertError) throw insertError;

  const { error: functionError } = await supabase.functions.invoke(
    "send-expert-request-email",
    { body: payload },
  );
  if (functionError) {
    throw new Error(
      "Your request was saved, but the email notification could not be " +
        "sent. Please make sure the Supabase Edge Function " +
        "'send-expert-request-email' is deployed and configured with " +
        "RESEND_API_KEY.",
    );
  }
}

export function normalizeApiError(error) {
  const status = error?.response?.status;
  const message = error?.response?.data?.message || error?.message || 'Unexpected error';
  return { status, message };
}



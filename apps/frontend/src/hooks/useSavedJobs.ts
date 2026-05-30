import { useEffect, useMemo, useState } from 'react';
import { jobs } from '../data/mockData';

const savedJobsStorageKey = 'rolematch_saved_job_ids';
const defaultSavedJobIds = jobs.filter((job) => job.saved).map((job) => job.id);

function readSavedJobIds() {
  try {
    const storedValue = window.localStorage.getItem(savedJobsStorageKey);

    if (!storedValue) {
      return defaultSavedJobIds;
    }

    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return defaultSavedJobIds;
    }

    return parsedValue.filter((item): item is string => typeof item === 'string');
  } catch {
    return defaultSavedJobIds;
  }
}

export function useSavedJobs() {
  const [savedJobIds, setSavedJobIds] = useState(readSavedJobIds);

  useEffect(() => {
    window.localStorage.setItem(savedJobsStorageKey, JSON.stringify(savedJobIds));
  }, [savedJobIds]);

  const savedJobIdSet = useMemo(() => new Set(savedJobIds), [savedJobIds]);

  const jobsWithSavedState = useMemo(
    () => jobs.map((job) => ({ ...job, saved: savedJobIdSet.has(job.id) })),
    [savedJobIdSet],
  );

  const savedJobs = useMemo(
    () => jobsWithSavedState.filter((job) => job.saved),
    [jobsWithSavedState],
  );

  const toggleSavedJob = (jobId: string) => {
    setSavedJobIds((currentIds) => (
      currentIds.includes(jobId)
        ? currentIds.filter((id) => id !== jobId)
        : [...currentIds, jobId]
    ));
  };

  return {
    jobsWithSavedState,
    savedJobs,
    savedJobIds,
    toggleSavedJob,
  };
}

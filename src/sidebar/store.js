import { createReduxStore, register } from '@wordpress/data';
import { STATUS_COLORS, STATUS_THEMES } from '../shared/status-themes';
import { STATUS_LABELS } from '../shared/status-labels';

export { STATUS_COLORS, STATUS_THEMES, statusThemeStyle, statusTextColor } from '../shared/status-themes';
export { STATUS_LABELS, statusLabel } from '../shared/status-labels';

const { flowEW } = window;

export const STORE_NAME = 'flow-ew/review';

const DEFAULT_STATE = {
  reviewers: [],
  review: flowEW.activeReview || null,
  loading: false,
  error: null,
};

const flowStore = createReduxStore(STORE_NAME, {
  reducer(state = DEFAULT_STATE, action) {
    switch (action.type) {
      case 'SET_REVIEWERS':
        return { ...state, reviewers: action.reviewers };
      case 'SET_REVIEW':
        return { ...state, review: action.review };
      case 'SET_LOADING':
        return { ...state, loading: action.loading };
      case 'SET_ERROR':
        return { ...state, error: action.error };
      default:
        return state;
    }
  },
  actions: {
    setReviewers: (reviewers) => ({ type: 'SET_REVIEWERS', reviewers }),
    setReview: (review) => ({ type: 'SET_REVIEW', review }),
    setLoading: (loading) => ({ type: 'SET_LOADING', loading }),
    setError: (error) => ({ type: 'SET_ERROR', error }),
  },
  selectors: {
    getReviewers: (state) => state.reviewers,
    getReview: (state) => state.review,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
  },
});

register(flowStore);

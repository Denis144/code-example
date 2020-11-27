import { Policy } from '../classes';


export function checkPolicy(
  policy: Policy,
  actionName: string,
  context?: unknown,
): boolean {
  const action = policy[actionName];

  if (!action) {
    return false;
  }

  const result = typeof action === 'function'
    ? action.call(policy, context)
    : action;

  return !!result;
}

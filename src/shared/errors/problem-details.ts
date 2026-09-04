import { NextResponse } from 'next/server';

export interface InvalidParamDetail {
  readonly field: string;
  readonly reason: string;
}

export interface ProblemDetailsProps {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly code: string;
  readonly invalidParams?: InvalidParamDetail[] | undefined;
  readonly timestamp?: number | undefined;
}

export class ProblemDetailsError extends Error {
  public readonly type: string;
  public readonly title: string;
  public readonly status: number;
  public readonly detail: string;
  public readonly code: string;
  public readonly invalidParams?: InvalidParamDetail[] | undefined;
  public readonly timestamp: number;

  constructor(props: ProblemDetailsProps) {
    super(props.detail);
    this.name = 'ProblemDetailsError';
    this.type = props.type;
    this.title = props.title;
    this.status = props.status;
    this.detail = props.detail;
    this.code = props.code;
    this.invalidParams = props.invalidParams;
    this.timestamp = props.timestamp ?? Date.now();
  }

  public toJSON(): ProblemDetailsProps {
    return {
      type: this.type,
      title: this.title,
      status: this.status,
      detail: this.detail,
      code: this.code,
      invalidParams: this.invalidParams,
      timestamp: this.timestamp,
    };
  }
}

export function createProblemResponse(props: ProblemDetailsProps): NextResponse {
  const problem = new ProblemDetailsError(props);
  return NextResponse.json(problem.toJSON(), {
    status: props.status,
    headers: {
      'Content-Type': 'application/problem+json',
    },
  });
}

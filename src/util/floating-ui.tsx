/*
MIT License

Copyright (c) 2021 Alexis Munsayac

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import {
	computePosition,
	type ComputePositionConfig,
	type ComputePositionReturn,
	type ReferenceElement,
} from '@floating-ui/dom';
import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js';

function ignore<Type>(_value: Type): void {
	// no-op
}

export type UseFloatingOptions<
	Ref extends ReferenceElement,
	Float extends HTMLElement,
> = Partial<ComputePositionConfig> & {
	whileElementsMounted?(reference: Ref, floating: Float, update: () => void): (() => void) | undefined;
};

type UseFloatingState = Omit<ComputePositionReturn, 'x' | 'y'> & {
	x?: number | null;
	y?: number | null;
};

export type UseFloatingResult = UseFloatingState & {
	update(): void;
};

export function useFloating<Ref extends ReferenceElement, Float extends HTMLElement>(
	reference: () => Ref | null | undefined,
	floating: () => Float | null | undefined,
	options?: UseFloatingOptions<Ref, Float>,
): UseFloatingResult {
	const placement = () => options?.placement ?? 'bottom';
	const strategy = () => options?.strategy ?? 'absolute';

	const [data, setData] = createSignal<UseFloatingState>({
		x: null,
		y: null,
		placement: placement(),
		strategy: strategy(),
		middlewareData: {},
	});

	const [error, setError] = createSignal<{ value: any } | undefined>();

	createEffect(() => {
		const currentError = error();
		if (currentError) {
			throw currentError.value;
		}
	});

	const version = createMemo(() => {
		reference();
		floating();
		return {};
	});

	async function update() {
		const currentReference = reference();
		const currentFloating = floating();

		if (currentReference && currentFloating) {
			const capturedVersion = version();
			try {
				const currentData = await computePosition(currentReference, currentFloating, {
					middleware: options?.middleware,
					placement: placement(),
					strategy: strategy(),
				});

				// Check if it's still valid
				if (capturedVersion === version()) {
					setData(currentData);
				}
			} catch (error) {
				setError(error as any);
			}
		}
	}

	createEffect(() => {
		const currentReference = reference();
		const currentFloating = floating();

		// Subscribe to other reactive properties
		ignore(options?.middleware);
		placement();
		strategy();

		if (currentReference && currentFloating) {
			if (options?.whileElementsMounted) {
				const cleanup = options.whileElementsMounted(currentReference, currentFloating, update);

				if (cleanup) {
					onCleanup(cleanup);
				}
			} else {
				void update();
			}
		}
	});

	return {
		get x() {
			return data().x;
		},
		get y() {
			return data().y;
		},
		get placement() {
			return data().placement;
		},
		get strategy() {
			return data().strategy;
		},
		get middlewareData() {
			return data().middlewareData;
		},
		update,
	};
}

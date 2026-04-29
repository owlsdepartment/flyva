import { describe, expect, it } from 'vitest';

import { applyLifecycleClasses, FLYVA_TRANSITION_DATA_ATTR } from '../lifecycle-classes';

const stages = [
	'beforeLeave',
	'leave',
	'afterLeave',
	'beforeEnter',
	'enter',
	'afterEnter',
] as const;

function expectClassesForStage(
	prefix: string,
	stage: (typeof stages)[number],
	transitionKey?: string,
) {
	const el = document.documentElement;
	if (transitionKey) {
		expect(el.getAttribute(FLYVA_TRANSITION_DATA_ATTR)).toBe(transitionKey);
	}
	switch (stage) {
		case 'beforeLeave':
			expect(el.classList.contains(`${prefix}-running`)).toBe(true);
			expect(el.classList.contains(`${prefix}-leave`)).toBe(true);
			expect(el.classList.contains(`${prefix}-leave-active`)).toBe(true);
			expect(el.classList.contains(`${prefix}-leave-to`)).toBe(false);
			expect(el.classList.contains(`${prefix}-pending`)).toBe(false);
			break;
		case 'leave':
			expect(el.classList.contains(`${prefix}-running`)).toBe(true);
			expect(el.classList.contains(`${prefix}-leave`)).toBe(false);
			expect(el.classList.contains(`${prefix}-leave-active`)).toBe(true);
			expect(el.classList.contains(`${prefix}-leave-to`)).toBe(true);
			expect(el.classList.contains(`${prefix}-pending`)).toBe(false);
			break;
		case 'afterLeave':
			expect(el.classList.contains(`${prefix}-running`)).toBe(true);
			expect(el.classList.contains(`${prefix}-pending`)).toBe(true);
			expect(el.classList.contains(`${prefix}-leave-active`)).toBe(false);
			expect(el.classList.contains(`${prefix}-leave-to`)).toBe(false);
			break;
		case 'beforeEnter':
			expect(el.classList.contains(`${prefix}-running`)).toBe(true);
			expect(el.classList.contains(`${prefix}-pending`)).toBe(false);
			expect(el.classList.contains(`${prefix}-enter`)).toBe(true);
			expect(el.classList.contains(`${prefix}-enter-active`)).toBe(true);
			expect(el.classList.contains(`${prefix}-enter-to`)).toBe(false);
			break;
		case 'enter':
			expect(el.classList.contains(`${prefix}-running`)).toBe(true);
			expect(el.classList.contains(`${prefix}-enter`)).toBe(false);
			expect(el.classList.contains(`${prefix}-enter-active`)).toBe(true);
			expect(el.classList.contains(`${prefix}-enter-to`)).toBe(true);
			break;
		case 'afterEnter':
			expect(el.classList.contains(`${prefix}-running`)).toBe(true);
			expect(el.classList.contains(`${prefix}-enter-active`)).toBe(false);
			expect(el.classList.contains(`${prefix}-enter-to`)).toBe(false);
			break;
	}
}

function runFullSequence(prefix: string, transitionKey = 'demoTransition') {
	for (const stage of stages) {
		applyLifecycleClasses(stage, prefix, transitionKey);
		expectClassesForStage(prefix, stage, transitionKey);
	}
	applyLifecycleClasses('none', prefix);
	const el = document.documentElement;
	expect(el.hasAttribute(FLYVA_TRANSITION_DATA_ATTR)).toBe(false);
	for (const token of [
		'prepare',
		'cleanup',
		'running',
		'pending',
		'leave',
		'leave-active',
		'leave-to',
		'enter',
		'enter-active',
		'enter-to',
	]) {
		expect(el.classList.contains(`${prefix}-${token}`)).toBe(false);
	}
}

describe('applyLifecycleClasses', () => {
	it('applies default flyva prefix through full sequence then clears on none', () => {
		runFullSequence('flyva');
	});

	it('applies custom prefix through full sequence then clears on none', () => {
		runFullSequence('app');
	});

	it('omits data-flyva-transition when transitionKey is empty', () => {
		applyLifecycleClasses('beforeLeave', 'flyva', '');
		expect(document.documentElement.hasAttribute(FLYVA_TRANSITION_DATA_ATTR)).toBe(false);
		applyLifecycleClasses('none', 'flyva');
	});
});

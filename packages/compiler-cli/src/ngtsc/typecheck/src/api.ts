/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BoundTarget, DirectiveMeta, SchemaMetadata} from '@angular/compiler';
import * as ts from 'typescript';

import {Reference} from '../../imports';
import {TemplateGuardMeta} from '../../metadata';
import {ClassDeclaration} from '../../reflection';

/**
 * Extension of `DirectiveMeta` that includes additional information required to type-check the
 * usage of a particular directive.
 */
export interface TypeCheckableDirectiveMeta extends DirectiveMeta {
  ref: Reference<ClassDeclaration>;
  queries: string[];
  ngTemplateGuards: TemplateGuardMeta[];
  coercedInputFields: Set<string>;
  hasNgTemplateContextGuard: boolean;
}

export type TemplateId = string & {__brand: 'TemplateId'};

/**
 * Metadata required in addition to a component class in order to generate a type check block (TCB)
 * for that component.
 */
export interface TypeCheckBlockMetadata {
  /**
   * A unique identifier for the class which gave rise to this TCB.
   *
   * This can be used to map errors back to the `ts.ClassDeclaration` for the component.
   */
  id: TemplateId;

  /**
   * Semantic information about the template of the component.
   */
  boundTarget: BoundTarget<TypeCheckableDirectiveMeta>;

  /*
   * Pipes used in the template of the component.
   */
  pipes: Map<string, Reference<ClassDeclaration<ts.ClassDeclaration>>>;

  /**
   * Schemas that apply to this template.
   */
  schemas: SchemaMetadata[];
}

export interface TypeCtorMetadata {
  /**
   * The name of the requested type constructor function.
   */
  fnName: string;

  /**
   * Whether to generate a body for the function or not.
   */
  body: boolean;

  /**
   * Input, output, and query field names in the type which should be included as constructor input.
   */
  fields: {inputs: string[]; outputs: string[]; queries: string[];};

  /**
   * `Set` of field names which have type coercion enabled.
   */
  coercedInputFields: Set<string>;
}

export interface TypeCheckingConfig {
  /**
   * Whether to check the left-hand side type of binding operations.
   *
   * For example, if this is `false` then the expression `[input]="expr"` will have `expr` type-
   * checked, but not the assignment of the resulting type to the `input` property of whichever
   * directive or component is receiving the binding. If set to `true`, both sides of the assignment
   * are checked.
   *
   * This flag only affects bindings to components/directives. Bindings to the DOM are checked if
   * `checkTypeOfDomBindings` is set.
   */
  checkTypeOfInputBindings: boolean;

  /**
   * Whether to use strict null types for input bindings for directives.
   *
   * If this is `true`, applications that are compiled with TypeScript's `strictNullChecks` enabled
   * will produce type errors for bindings which can evaluate to `undefined` or `null` where the
   * inputs's type does not include `undefined` or `null` in its type. If set to `false`, all
   * binding expressions are wrapped in a non-null assertion operator to effectively disable strict
   * null checks. This may be particularly useful when the directive is from a library that is not
   * compiled with `strictNullChecks` enabled.
   *
   * If `checkTypeOfInputBindings` is set to `false`, this flag has no effect.
   */
  strictNullInputBindings: boolean;

  /**
   * Whether to check text attributes that happen to be consumed by a directive or component.
   *
   * For example, in a template containing `<input matInput disabled>` the `disabled` attribute ends
   * up being consumed as an input with type `boolean` by the `matInput` directive. At runtime, the
   * input will be set to the attribute's string value, which is an empty string for attributes
   * without a value, so with this flag set to `true`, an error would be reported. If set to
   * `false`, text attributes will never report an error.
   *
   * Note that if `checkTypeOfInputBindings` is set to `false`, this flag has no effect.
   */
  checkTypeOfAttributes: boolean;

  /**
   * Whether to check the left-hand side type of binding operations to DOM properties.
   *
   * As `checkTypeOfBindings`, but only applies to bindings to DOM properties.
   *
   * This does not affect the use of the `DomSchemaChecker` to validate the template against the DOM
   * schema. Rather, this flag is an experimental, not yet complete feature which uses the
   * lib.dom.d.ts DOM typings in TypeScript to validate that DOM bindings are of the correct type
   * for assignability to the underlying DOM element properties.
   */
  checkTypeOfDomBindings: boolean;

  /**
   * Whether to infer the type of the `$event` variable in event bindings for directive outputs or
   * animation events.
   *
   * If this is `true`, the type of `$event` will be inferred based on the generic type of
   * `EventEmitter`/`Subject` of the output. If set to `false`, the `$event` variable will be of
   * type `any`.
   */
  checkTypeOfOutputEvents: boolean;

  /**
   * Whether to infer the type of the `$event` variable in event bindings for animations.
   *
   * If this is `true`, the type of `$event` will be `AnimationEvent` from `@angular/animations`.
   * If set to `false`, the `$event` variable will be of type `any`.
   */
  checkTypeOfAnimationEvents: boolean;

  /**
   * Whether to infer the type of the `$event` variable in event bindings to DOM events.
   *
   * If this is `true`, the type of `$event` will be inferred based on TypeScript's
   * `HTMLElementEventMap`, with a fallback to the native `Event` type. If set to `false`, the
   * `$event` variable will be of type `any`.
   */
  checkTypeOfDomEvents: boolean;

  /**
   * Whether to infer the type of local references to DOM elements.
   *
   * If this is `true`, the type of a `#ref` variable on a DOM node in the template will be
   * determined by the type of `document.createElement` for the given DOM node type. If set to
   * `false`, the type of `ref` for DOM nodes will be `any`.
   */
  checkTypeOfDomReferences: boolean;


  /**
   * Whether to infer the type of local references.
   *
   * If this is `true`, the type of a `#ref` variable that points to a directive or `TemplateRef` in
   * the template will be inferred correctly. If set to `false`, the type of `ref` for will be
   * `any`.
   */
  checkTypeOfNonDomReferences: boolean;

  /**
   * Whether to include type information from pipes in the type-checking operation.
   *
   * If this is `true`, then the pipe's type signature for `transform()` will be used to check the
   * usage of the pipe. If this is `false`, then the result of applying a pipe will be `any`, and
   * the types of the pipe's value and arguments will not be matched against the `transform()`
   * method.
   */
  checkTypeOfPipes: boolean;

  /**
   * Whether to narrow the types of template contexts.
   */
  applyTemplateContextGuards: boolean;

  /**
   * Whether to use a strict type for null-safe navigation operations.
   *
   * If this is `false`, then the return type of `a?.b` or `a?()` will be `any`. If set to `true`,
   * then the return type of `a?.b` for example will be the same as the type of the ternary
   * expression `a != null ? a.b : a`.
   */
  strictSafeNavigationTypes: boolean;

  /**
   * Whether to descend into template bodies and check any bindings there.
   */
  checkTemplateBodies: boolean;

  /**
   * Whether to check resolvable queries.
   *
   * This is currently an unsupported feature.
   */
  checkQueries: false;

  /**
   * Whether to use any generic types of the context component.
   *
   * If this is `true`, then if the context component has generic types, those will be mirrored in
   * the template type-checking context. If `false`, any generic type parameters of the context
   * component will be set to `any` during type-checking.
   */
  useContextGenericType: boolean;

  /**
   * Whether or not to infer types for object and array literals in the template.
   *
   * If this is `true`, then the type of an object or an array literal in the template will be the
   * same type that TypeScript would infer if the literal appeared in code. If `false`, then such
   * literals are cast to `any` when declared.
   */
  strictLiteralTypes: boolean;
}


export type TemplateSourceMapping =
    DirectTemplateSourceMapping | IndirectTemplateSourceMapping | ExternalTemplateSourceMapping;

/**
 * A mapping to an inline template in a TS file.
 *
 * `ParseSourceSpan`s for this template should be accurate for direct reporting in a TS error
 * message.
 */
export interface DirectTemplateSourceMapping {
  type: 'direct';
  node: ts.StringLiteral|ts.NoSubstitutionTemplateLiteral;
}

/**
 * A mapping to a template which is still in a TS file, but where the node positions in any
 * `ParseSourceSpan`s are not accurate for one reason or another.
 *
 * This can occur if the template expression was interpolated in a way where the compiler could not
 * construct a contiguous mapping for the template string. The `node` refers to the `template`
 * expression.
 */
export interface IndirectTemplateSourceMapping {
  type: 'indirect';
  componentClass: ClassDeclaration;
  node: ts.Expression;
  template: string;
}

/**
 * A mapping to a template declared in an external HTML file, where node positions in
 * `ParseSourceSpan`s represent accurate offsets into the external file.
 *
 * In this case, the given `node` refers to the `templateUrl` expression.
 */
export interface ExternalTemplateSourceMapping {
  type: 'external';
  componentClass: ClassDeclaration;
  node: ts.Expression;
  template: string;
  templateUrl: string;
}

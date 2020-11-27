# PUV Policy

This package provides directives to Angular templates, so you can show or hide elements and components, disable or enable form controls.

## Write a policy

To implement a policy, declare class which extends `Policy` base class.

```typescript
import { Injectable } from '@angular/core';
import { Policy } from '@lib/policy';


@Injectable({ provideIn: 'root' })
export class UserPolicy extends Policy {}
```

Each policy should have methods or properties returning boolean value.

```typescript
@Injectable({ provideIn: 'root' })
export class UserPolicy extends Policy {

  public readonly name = 'UserPolicy';

  public edit(): boolean {
    return this.currentUser.can('auth.auth_admin.user_profile:edit_user');
  }

}
``` 

> `CurrentUser` is available for each `Policy` instance. 

## Provide the policy:

```typescript
@NgModule({
  providers: [
    {
      provide: POLICY,
      useExisting: UserPolicy,
      multi: true,
    },
  ],
})
export class AppModule {}
```

## Use policies

To add directives into your application's templates, you need to import `PolicyModule` in your `AppModule`.

```typescript
@NgModule({
  imports: [
    PolicyModule,
  ],
})
export class AppModule {}
``` 

### Check policy in templates

To show or hide any content you can use `PolicyDirective`:

```html
<button *puvPolicy="'UserPolicy'; can: 'edit'">Edit</button>
```

To disable form controls you can use `PolicyDisableDirective`:

```html
<button puvPolicy="UserPolicy" puvPolicyDisable="edit">Edit</button>
```

To enable form controls you can use `PolicyEnableDirective`:

```html
<button puvPolicy="UserPolicy" puvPolicyEnable="edit">Edit</button>
```

To each policy directives you can provide any context to additional checking of something.
Use `puvPolicyContext` input for that. For example:

```html
<button *puvPolicy="'UserPolicy'; can: 'edit'; context: someContext">Edit</button>
```

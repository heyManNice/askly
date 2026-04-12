import Mountain from "@layouts/Mountain.vue";

export type PageSwitcher = Parameters<NonNullable<InstanceType<typeof Mountain>['$slots']['top-page']>>[0]['page'];

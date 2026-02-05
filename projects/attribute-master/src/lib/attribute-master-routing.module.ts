import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AttributeFormComponent } from './components/attribute-form/attribute-form.component';
import { AttributeMappingComponent } from './components/attribute-mapping/attribute-mapping.component';

export const routes: Routes = [
  { path: 'attribute-master', component: AttributeFormComponent },
  { path: 'attribute-mapping', component: AttributeMappingComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AttributeMasterLibraryRoutingModule {}

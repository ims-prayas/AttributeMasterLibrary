import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AttributeFormComponent } from './components/attribute-form/attribute-form.component';
import { AttributeMappingComponent } from './components/attribute-mapping/attribute-mapping.component';
import { AttributeValueMasterComponent } from './components/attribute-value-master/attribute-value-master.component';

export const routes: Routes = [
  { path: 'attribute-master', component: AttributeFormComponent },
  { path: 'attribute-mapping', component: AttributeMappingComponent },
  { path: 'attribute-value-master', component: AttributeValueMasterComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AttributeMasterLibraryRoutingModule {}

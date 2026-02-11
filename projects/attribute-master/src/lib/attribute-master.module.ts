import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { AttributeMasterLibraryRoutingModule } from './attribute-master-routing.module';
import { AttributeMasterComponent } from './attribute-master.component';
import { AttributeFormComponent } from './components/attribute-form/attribute-form.component';
import { AttributeMappingComponent } from './components/attribute-mapping/attribute-mapping.component';
import { AttributeTableComponent } from './components/attribute-table/attribute-table.component';
import { HeaderComponent } from './components/header/header.component';
import { JwtInterceptor } from './jwt.interceptor';
import { DialogComponent } from './components/dialog/dialog.component';
import { AttributeValueMasterComponent } from './components/attribute-value-master/attribute-value-master.component';

@NgModule({
  declarations: [
    AttributeMasterComponent,
    HeaderComponent,
    AttributeFormComponent,
    AttributeTableComponent,
    AttributeMappingComponent,
    DialogComponent,
    AttributeValueMasterComponent,
  ],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    HttpClientModule,
    NgxPaginationModule,
    MatDialogModule
  ],
  exports: [AttributeMasterComponent, AttributeMasterLibraryRoutingModule, AttributeFormComponent, AttributeMappingComponent, AttributeValueMasterComponent],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
  ],
})
export class AttributeMasterModule {}

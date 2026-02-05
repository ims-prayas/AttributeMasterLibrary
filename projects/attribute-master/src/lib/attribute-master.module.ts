import { NgModule } from '@angular/core';
import { AttributeMasterComponent } from './attribute-master.component';
import { HeaderComponent } from './components/header/header.component';
import { AttributeFormComponent } from './components/attribute-form/attribute-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AttributeMasterLibraryRoutingModule } from './attribute-master-routing.module';
import { AttributeTableComponent } from './components/attribute-table/attribute-table.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { AttributeMappingComponent } from './components/attribute-mapping/attribute-mapping.component';
import { JwtInterceptor } from './jwt.interceptor';

@NgModule({
  declarations: [
    AttributeMasterComponent,
    HeaderComponent,
    AttributeFormComponent,
    AttributeTableComponent,
    AttributeMappingComponent,
  ],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    HttpClientModule,
    NgxPaginationModule,
  ],
  exports: [AttributeMasterComponent, AttributeMasterLibraryRoutingModule],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
  ],
})
export class AttributeMasterModule {}

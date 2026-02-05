import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AttributeMasterService } from '../../attribute-master.service';

@Component({
  selector: 'lib-attribute-mapping',
  templateUrl: './attribute-mapping.component.html',
  styleUrls: ['./attribute-mapping.component.css'],
})
export class AttributeMappingComponent implements OnInit {
  attributeForm!: FormGroup;
  attributeTypes: any[] = [];
  applyTo: any[] = [];

  constructor(
    private fb: FormBuilder,
    private attributeMasterService: AttributeMasterService,
  ) {}

  ngOnInit(): void {
    this.formInitializer();
    this.loadDropdowns();
    this.attributeForm.get('AttributeType')?.valueChanges.subscribe((type) => {
      this.attributeMasterService.getApplyToList(type).subscribe((res: any) => {
        if (res.status === 'ok') {
          this.applyTo = res.result;
        }
      });
    });
    this.attributeForm.get('MappedFor')?.valueChanges.subscribe((data) => {});
  }

  formInitializer() {
    this.attributeForm = this.fb.group({
      AttributeType: [''],
      ApplyTo: [''],
      MappedFor: [''],
    });
  }

  loadDropdowns() {
    this.attributeMasterService.getAttributeTypes().subscribe((res: any) => {
      if (res.status === 'ok') this.attributeTypes = res.result;
    });
  }
}

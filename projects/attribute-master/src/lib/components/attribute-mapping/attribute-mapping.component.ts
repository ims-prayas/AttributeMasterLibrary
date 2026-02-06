import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AttributeMasterService } from '../../attribute-master.service';

@Component({
  selector: 'lib-attribute-mapping',
  templateUrl: './attribute-mapping.component.html',
  styleUrls: ['./attribute-mapping.component.css'],
})
export class AttributeMappingComponent implements OnInit, OnDestroy {
  attributeForm!: FormGroup;
  attributeTypes: any[] = [];
  applyTo: any[] = [];
  isChecked: boolean = false;
  private destroy$ = new Subject<void>();
  isEdit: boolean = false;
  selectedAttributeIds = new Set<number>();
  mappedForList: any[] = []
  attributesList: any[] = [];
  mappedAttributesList: any[] =[];

  constructor(
    private fb: FormBuilder,
    private attributeMasterService: AttributeMasterService,
  ) {}
  
  ngOnInit(): void {
    this.formInitializer();
    this.loadDropdowns();

this.attributeMasterService.saveRequested$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.handleMappingSave());

    this.attributeForm.get('AttributeType')?.valueChanges.subscribe((type) => {
      if(type == 'Transaction'){
        this.attributeForm.get('ApplyTo')?.setValue(null)
          this.attributeMasterService.getAttributesForMapping(type).subscribe((res: any) =>{
            if(res.status == 'ok'){
              this.attributesList = res.result.length > 0? res.result  : [];
              this.mappedForList = res.result2.length > 0 ? res.result2 : []
              this.mappedAttributesList = this.attributesList.filter((item: any) => item.IsMapped);
              this.syncData();
            }
        });
      }
      this.attributeMasterService.getApplyToList(type).subscribe((res: any) => {
        if (res.status === 'ok') {
          this.applyTo = res.result;
        }
      });
    });

    this.attributeForm.get('ApplyTo')?.valueChanges.subscribe((id) => {
      const attrType = this.attributeForm.get('AttributeType')?.value;
      if (attrType && id) {
        this.attributeMasterService.getAttributesForMapping(attrType, id).subscribe((res: any) =>{
          if(res.status == 'ok'){
            this.attributesList = res.result.length > 0? res.result  : [];
            this.mappedForList = res.result2.length > 0 ? res.result2 : []
            this.mappedAttributesList = this.attributesList.filter((item: any) => item.IsMapped);
            this.syncData();
          }
        });
      }
    });

    this.attributeForm.get('MappedFor')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(mappedFor => {
        const attrType = this.attributeForm.get('AttributeType')?.value;
        const applyTo = this.attributeForm.get('ApplyTo')?.value;

        if(attrType == 'Transaction'){
            this.attributeMasterService .getAttributesForMapping(attrType,  applyTo, mappedFor)
            .subscribe((res: any) => {
              if (res.status === 'ok') {
              this.attributesList = res.result || [];
              this.mappedAttributesList = this.attributesList.filter((item: any) => item.IsMapped);
              this.syncData(); 
            }
          });
        }

        if (!attrType || !applyTo || !mappedFor) {
          return;
        }
        
        this.attributeMasterService .getAttributesForMapping(attrType, applyTo, mappedFor)
        .subscribe((res: any) => {
          if (res.status === 'ok') {
            this.attributesList = res.result || [];
            this.mappedAttributesList =
            this.attributesList.filter((item: any) => item.IsMapped);
            this.syncData(); 
        }
      });
    });

    
    this.attributeMasterService.resetForm$
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.attributeForm.reset();
      this.isEdit = false;
      this.attributesList = []
      this.mappedAttributesList = [];
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  formInitializer() {
    this.attributeForm = this.fb.group({
      AttributeType: ['', Validators.required],
      ApplyTo: ['', Validators.required],
      MappedFor: ['', Validators.required],
    });
  }

  loadDropdowns() {
    this.attributeMasterService.getAttributeTypes().subscribe((res: any) => {
      if (res.status === 'ok') {
        this.attributeTypes = res.result;
      }
    });
  }

  deleteItem(item: any): void {
    this.mappedAttributesList = this.mappedAttributesList.filter((mapped: any) => mapped.AttributeListID !== item.AttributeListID);
    const found = this.attributesList.find((x: any) => x.AttributeListID == item.AttributeListID);
    if (found) {
      found.IsMapped = false;
    }
    this.syncData();
  }

  syncData() {
    const form = this.attributeForm.getRawValue();
    this.attributeMasterService.mappingMasterObj = {
      AttributeType: form.AttributeType,
      ApplyTo: form.ApplyTo,
      MappedFor: form.MappedFor,
      AttributesList: this.mappedAttributesList.map((m: any) => ({
        AttributeListID: m.AttributeListID,
      })),
    };
  }

  handleSave() {
    if (!this.attributeForm.valid) {
      this.attributeForm.markAllAsTouched();
      alert('Please fill all required fields');
      return;
    }
    if (this.attributeForm.valid && this.mappedAttributesList.length > 0) {
    this.attributeMasterService.saveAttributeMapping().subscribe({
      next: (res: any) => {
        if (res.status === 'ok') {
          this.attributeMasterService.resetForm();
          this.attributeMasterService.clearTable();
          alert(res.result);
        }
      },
      error: (err) => alert('Mapping Save Error: ' + err.message)
    });
  }
  }

  toggleCheck(item: any, event: Event): void {
  const checked = (event.target as HTMLInputElement).checked;

  if (checked) {
    item.IsMapped = true;
    this.selectedAttributeIds.add(item.AttributeListID);
    const selectedItems = this.attributesList.filter(item =>this.selectedAttributeIds.has(item.AttributeListID));

    selectedItems.forEach((item: any) => {
    const exists = this.mappedAttributesList.some((mapped: any) => mapped.AttributeListID === item.AttributeListID);
    if (!exists) {
      this.mappedAttributesList.push(item);
    }
  });

  this.selectedAttributeIds.clear();
  } else {
    this.selectedAttributeIds.delete(item.AttributeListID);
    this.deleteItem(item);
  }
  this.syncData();
  }

  handleMappingSave() {
    if (this.attributeForm.invalid) {
      this.attributeForm.markAllAsTouched();
      alert('Please complete the mapping requirements.');
      return;
    }

    this.syncData(); 

    this.attributeMasterService.saveAttributeMapping().subscribe({
      next: (res: any) => {
        if (res.status === 'ok') {
          alert('Attribute Mapping Saved Successfully');
          this.attributeMasterService.resetForm();
        } else {
          alert(res.message || 'Mapping failed');
        }
      },
      error: () => alert('Network error while saving Mapping')
    });
  }
}

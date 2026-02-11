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

  loadDropdowns(){
    this.attributeMasterService.getAttributeTypes().subscribe({
     next: (res: any)  =>{
      if(res.status == 'ok'){
        this.attributeTypes = res.result
        this.attributeTypes = this.attributeTypes.filter(item => item.AttributeTypeID != 'Document')
      }else{
        this.attributeMasterService.openErrorDialog(res.result)
      }
     },
     error: ()=> this.attributeMasterService.openErrorDialog('Failed to load mappings')
    });
  }

  deleteItem(item: any): void {
    const found = this.attributesList.find((x: any) => x.AttributeListID == item.AttributeListID);
    if(found && found.IsParentForMappedAttributes){
      this.attributeMasterService.openErrorDialog('Selected atttribute is parent for other mapped attributes')
      return;
    }
    this.mappedAttributesList = this.mappedAttributesList.filter((mapped: any) => mapped.AttributeListID !== item.AttributeListID);
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
        this.attributeMasterService.openErrorDialog('Please fill all required fields');
        return;
      }
      if (this.attributeForm.valid && this.mappedAttributesList.length > 0) {
      this.attributeMasterService.saveAttributeMapping().subscribe({
        next: (res: any) => {
          if (res.status === 'ok') {
            this.attributeMasterService.resetForm();
            this.attributeMasterService.clearTable();
            this.attributeMasterService.openSuccessDialog(res.result);
          }
        },
        error: (err) => this.attributeMasterService.openErrorDialog('Failed to save mapping')
      });
    }
  }

  toggleCheck(item: any, event: Event): void {
  const checkbox = event.target as HTMLInputElement;
  const checked = checkbox.checked;

  if (checked) {
    if (item.IsParentAttributeMapped) {
      checkbox.checked = false;
      item.IsMapped = false;
      this.attributeMasterService.openErrorDialog('Parent atttribute of selected attribute is already mapped.');
      return; 
    }

    item.IsMapped = true;
    
    const exists = this.mappedAttributesList.find(m => m.AttributeListID === item.AttributeListID);
    if (!exists) {
      this.mappedAttributesList.push(item);
    }

  } else {
    if (item.IsParentForMappedAttributes) {
      this.attributeMasterService.openErrorDialog('Selected attribute is parent for other mapped attributes');
      checkbox.checked = true;
      item.IsMapped = true;
      return;
    }
    
    this.deleteItem(item);
  }
  
  this.syncData();
}

  handleMappingSave() {
    if (this.attributeForm.invalid) {
      this.attributeForm.markAllAsTouched();
      this.attributeMasterService.openErrorDialog('Please complete the mapping requirements.');
      return;
    }

    this.syncData(); 

    this.attributeMasterService.saveAttributeMapping().subscribe({
      next: (res: any) => {
        if (res.status === 'ok') {
          this.attributeMasterService.openSuccessDialog('Attribute Mapping Saved Successfully');
          this.attributeMasterService.resetForm();
        } else {
          this.attributeMasterService.openErrorDialog(res.message || 'Mapping failed');
        }
      },
      error: () => this.attributeMasterService.openSuccessDialog('Failed to save mapping')
    });
  }

  handleAttributeTypeChange(event: Event){
    const type = (event.target as HTMLInputElement).value
    if(!type){
      return;
    }
    this.resetOnAttributeTypeChange();

    if(type == 'Transaction'){
      this.attributeForm.get('ApplyTo')?.setValue(null);
      this.attributeForm.get('ApplyTo')?.disable();
      this.attributeMasterService.getAttributesForMapping(type).subscribe({
        next: (res: any)=>{
          if(res.status == 'ok'){
            this.attributesList = res.result.length > 0? res.result  : [];
            this.mappedForList = res.result2.length > 0 ? res.result2 : []
            this.mappedAttributesList = this.attributesList.filter((item: any) => item.IsMapped);
            this.syncData();
          }
        },
        error: ()=> this.attributeMasterService.openErrorDialog('Failed to fetch apply to list')
      })
    }else{
      this.attributeForm.get('ApplyTo')?.enable();
    }

    this.attributeMasterService.getApplyToList(type).subscribe({
      next: (res: any)=>{
        if (res.status === 'ok') {
          this.applyTo = res.result;
        }  
      }, 
      error: ()=> this.attributeMasterService.openErrorDialog('Failed to fetch apply to list')
    })
  }

  handleApplyToChange(event: Event){
    const applyTo = (event.target as HTMLInputElement).value
    const attrType = this.attributeForm.get('AttributeType')?.value
    if(attrType && applyTo){
      this.attributeMasterService.getAttributesForMapping(attrType, applyTo).subscribe({
        next: (res: any)=>{
         if (res.status === 'ok') {
          this.attributesList = res.result || [];
          this.mappedAttributesList = this.attributesList.filter((item: any) => item.IsMapped);
          this.mappedForList = res.result2.length > 0 ? res.result2 : [];
          this.syncData(); 
          } 
        },
        error: ()=> this.attributeMasterService.openErrorDialog('Attributes master is not configured')
      })
    }
  }

   handleMappedForChange(event: Event){
    const mappedFor = (event.target as HTMLInputElement).value
    const attrType = this.attributeForm.get('AttributeType')?.value
    const applyTo = this.attributeForm.get('ApplyTo')?.value

    if (!attrType || !applyTo || !mappedFor) {
      return;
    }

    this.attributeMasterService.getAttributesForMapping(attrType, applyTo, mappedFor).subscribe({
      next: (res: any)=>{
        if (res.status === 'ok') {
          this.attributesList = res.result || [];
          this.mappedAttributesList =
          this.attributesList.filter((item: any) => item.IsMapped);
          this.syncData(); 
        } 
      },
      error: ()=> this.attributeMasterService.openErrorDialog('Falied to load mappings')
    })
   }

  resetOnAttributeTypeChange(){
    this.attributeForm.get('MappedFor')?.setValue(null);
    this.attributeForm.get('ApplyTo')?.setValue(null);
    this.attributesList = []
    this.mappedAttributesList = []
  }
}

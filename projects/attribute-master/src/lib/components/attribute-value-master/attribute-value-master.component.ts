import { Component, OnInit, OnDestroy} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject , of } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import {
  AttributeMasterService,
  AttributeDetails,
} from '../../attribute-master.service';
import { AttributeValueList, ParentAttribute } from './Attribute';

@Component({
  selector: 'app-attribute-value-master',
  templateUrl: './attribute-value-master.component.html',
  styleUrls: ['./attribute-value-master.component.css']
})

export class AttributeValueMasterComponent implements OnInit,OnDestroy {
    attributeValueForm!: FormGroup;

    attributeTypes: any[] = [];
    applysTo: any[] = []
    attributeNames: any[] = [];
    attributeValueList: AttributeValueList[] = [];

    ParentAttributeInfo: ParentAttribute = {
      HasParent: false,
      ParentName: '',
      ParentValues: []
    };

    hasParent: boolean = false;
    parentName: string = '';
    parentValueList: any[] = [];


    isEdit: boolean = false;
    editingIndex: number = -1;
    private destroy$ = new Subject<void>();

    page: number = 1;
    itemsPerPage: number = 7;
    

    constructor(
      private fb: FormBuilder,
      public attributeMasterService: AttributeMasterService,
  ) {}
  
    ngOnInit(): void {
      this.initForm();
      this.loadAttribute();
      
      this.attributeMasterService.saveRequested$.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.onSave();
      });

      this.attributeMasterService.resetForm$.pipe(takeUntil(this.destroy$)).subscribe(() => {
          this.attributeValueForm.reset();
          this.attributeValueList = [];
          this.hasParent = false;
          this.isEdit = false;
          this.editingIndex = -1;
        });

      this.attributeValueForm.get('AttributeType')?.valueChanges.subscribe((type) => {
        if(!type) {
          return;
        }
        this.attributeValueForm.get('ApplyTo')?.setValue('');
        this.attributeNames = [];
        this.resetFormToAddMode();

        if(type == 'Transaction'){  
          this.attributeValueForm.get('ApplyTo')?.setValue(null);
          this.attributeMasterService.getAttributeValueList(type).subscribe((res: any) => {
            if (res.status === 'ok') {
              this.attributeValueList = res.result;
            }
          });
          this.attributeMasterService.getAttributeNames(type).subscribe((res: any) => {
            if (res.status === 'ok') {
              this.attributeNames = res.result;
            }
          });
        }
        else{
          this.attributeMasterService.getApplyToList(type).subscribe((res: any) => {
            if (res.status === 'ok') {
              this.applysTo = res.result;
            }
          });
        }
      });

      this.attributeValueForm.get('ApplyTo')?.valueChanges.subscribe((apply) => {
        const attrType = this.attributeValueForm.get('AttributeType')?.value;
        if (attrType && apply) {
          this.attributeMasterService.getAttributeNames(attrType,apply).subscribe((res: any) => {
            if (res.status === 'ok') {
              this.attributeNames = res.result;
            }
          });
          this.attributeMasterService.getAttributeValueList(attrType,apply).subscribe((res: any) => {
            if (res.status === 'ok') {
              this.attributeValueList = res.result;
            }
          });
        }
      });

      this.attributeValueForm.get('AttributeName')?.valueChanges.subscribe((obj) => {
        if (!obj || !obj.AttributeListId) {
          return; 
        }
        this.attributeMasterService?.getParentAttributeInfo(obj.AttributeListId).subscribe((res: any) => {
          if (res.status === 'ok') {
            this.ParentAttributeInfo = res?.result;
            const parentAttributeControl = this.attributeValueForm.get('ParentAttributeValue');
            if(this.ParentAttributeInfo.HasParent){
              this.hasParent = this.ParentAttributeInfo.HasParent;
              this.parentName = this.ParentAttributeInfo.ParentName;
              this.parentValueList = this.ParentAttributeInfo.ParentValues;
              parentAttributeControl?.setValidators([Validators.required]);
            }
            else {
              this.hasParent = false;
              this.parentName = '';
              this.parentValueList = [];
              parentAttributeControl?.clearValidators();
              parentAttributeControl?.setValue('');
            }
            parentAttributeControl?.updateValueAndValidity();
          }
        });
      });
    }
  
    ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
    }

    initForm() {
      this.attributeValueForm = this.fb.group({
        AttributeType: ['', Validators.required],
        ApplyTo: [''],
        AttributeName: ['', Validators.required],
        AttributeValue:['', Validators.required],
        ParentAttributeValue:  [''],
        AttributeValueId: [''],
      });
    }
  
    loadAttribute() {
      this.attributeMasterService.getAttributeTypes().subscribe((res: any) => {
        if (res.status === 'ok') this.attributeTypes = res.result;
      });
    }
  
    editAttribute(pageIndex: number) {
      const realIndex = (this.page - 1) * this.itemsPerPage + pageIndex;
      this.editingIndex = realIndex;
      this.isEdit = true;

      const item = this.attributeValueList[realIndex];

      const selectedAttributeName = this.attributeNames.find(
        attr => attr.AttributeListId === item.AttributeListId
      );
      
      if (!selectedAttributeName) return;
      this.attributeValueForm.patchValue({
        AttributeName: selectedAttributeName,
        AttributeValue: item.AttributeValue || '',
        AttributeValueId: item.AttributeValueId,
      });
      of(item.AttributeListId).pipe(switchMap((attributeListId) => this.attributeMasterService.getParentAttributeInfo(attributeListId)),takeUntil(this.destroy$)).subscribe((res: any) => {
        if (res.status !== 'ok') return;

        this.ParentAttributeInfo = res.result;

        const parentControl = this.attributeValueForm.get('ParentAttributeValue');

        if (this.ParentAttributeInfo.HasParent) {
          this.hasParent = true;
          this.parentName = this.ParentAttributeInfo.ParentName;
          this.parentValueList = this.ParentAttributeInfo.ParentValues;
          const selectedParentValue = this.parentValueList.find(parent => parent.AttributeValueId === item.ParentAttributeValueId);

          parentControl?.setValidators([Validators.required]);

          this.attributeValueForm.patchValue({
            ParentAttributeValue: selectedParentValue || ''
          });
        } 
        else {
          this.hasParent = false;
          this.parentName = '';
          this.parentValueList = [];

          parentControl?.clearValidators();
          parentControl?.setValue('');
        }
        parentControl?.updateValueAndValidity();
      });
      this.disableAttributeName(item)
    }

    disableAttributeName(item:AttributeValueList){
      const isUsedAsParent = !!item.AttributeValueId && this.attributeValueList.some(
        x => x.ParentAttributeValueId === item.AttributeValueId
      );

      const attributeNameControl = this.attributeValueForm.get('AttributeName');

      if (isUsedAsParent) {
        attributeNameControl?.disable();
      } else {
        attributeNameControl?.enable();
      }
    }


    deleteAttribute(pageIndex: number) {
      const realIndex = (this.page - 1) * this.itemsPerPage + pageIndex;
      const item = this.attributeValueList[realIndex];
      if ( item.AttributeValueId != null && this.attributeValueList.some(x => x.ParentAttributeValueId === item.AttributeValueId)) {
       this.attributeMasterService.openErrorDialog("Cannot delete as this entry is used as parent.");
       return;
      }
      this.attributeValueList.splice(realIndex, 1); 
      if (this.editingIndex === realIndex) {
        this.resetFormToAddMode();
      }
      else if (this.editingIndex > realIndex) {
        this.editingIndex--;
      }
    }

    AddAttribute() {
      const formValue = this.attributeValueForm.getRawValue();
      const newItem = {
        AttributeListId: formValue.AttributeName.AttributeListId,
        AttributeName: formValue.AttributeName.attributeName,
        AttributeValue: formValue.AttributeValue,
        AttributeValueId: formValue.AttributeValueId || "",
        ...(this.parentName && { ParentAttributeName: this.parentName }),
        ...(formValue.ParentAttributeValue && {
        ParentAttributeValueName: formValue.ParentAttributeValue.AttributeValue,
        ParentAttributeValueId: formValue.ParentAttributeValue.AttributeValueId
        })
      };
      
      const isDuplicate = this.attributeValueList.some(
          (item, index) => {
          if (this.isEdit && this.editingIndex === index) return false;
          return (
            (item.AttributeValue === formValue.AttributeValue) && (item.AttributeListId === formValue.AttributeName.AttributeListId)
          );
        }
      );

      if (isDuplicate) {
        this.attributeMasterService.openErrorDialog('The Attribute Name with this Attribute Value already exists!');
        return;
      }
      if (this.isEdit && this.editingIndex >= 0) {
        this.attributeValueList[this.editingIndex] = newItem;
      } else {
        this.attributeValueList.push(newItem);
      }
      this.resetFormToAddMode();
    }
    
    resetFormToAddMode() {
      this.editingIndex = -1;
      this.isEdit = false;
      this.hasParent = false;
      
      this.attributeValueForm.get('AttributeName')?.enable({ emitEvent: false });

      this.attributeValueForm.patchValue({
        AttributeName: '',
        AttributeValue: '',
        ParentAttributeValue: ''
      });
    }

    get pagedAttributeValueList(): AttributeValueList[] {
      const start = (this.page - 1) * this.itemsPerPage;
      return this.attributeValueList.slice(start, start + this.itemsPerPage);
    }
    
    onSave() {
      const headerControls = ['AttributeType', 'ApplyTo'];

        for (const controlName of headerControls) {
          const control = this.attributeValueForm.get(controlName);
          if (control?.invalid) {
            this.attributeMasterService.openErrorDialog('Please select Attribute Type and Apply To');
            return;
          }
        }

        if (this.attributeValueList.length === 0) {
          this.attributeMasterService.openErrorDialog('Please add at least one Attribute Value');
          return;
        }

      const formValue = this.attributeValueForm.getRawValue();

      const payload = {
        AttributeType: formValue.AttributeType,
        ApplyTo: formValue.ApplyTo,
        AttributeValues: this.attributeValueList
      };
      this.attributeMasterService.attributeValueMasterObj = payload;

      this.attributeMasterService
        .saveAttributeValues(this.isEdit ? 'edit' : 'add')
        .subscribe({
          next: (res: any) => {
            if (res.status === 'ok') {
              this.attributeMasterService.resetForm();
              this.attributeMasterService.openSuccessDialog(res.result);
            } else {
              this.attributeMasterService.openErrorDialog(res.result || 'Save failed');
            }
          },
          error: () => this.attributeMasterService.openErrorDialog('Failed Saving Attribute')
        });
    }
}

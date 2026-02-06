import { Component, OnInit, OnDestroy} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
    ID!: number;
    private destroy$ = new Subject<void>();
    page: number = 1;
    itemsPerPage: number = 10;

    constructor(
      private fb: FormBuilder,
      public attributeMasterService: AttributeMasterService,
  ) {}
  
    ngOnInit(): void {
      this.initForm();
      this.loadAttribute();
      
      
      this.attributeMasterService.resetForm$.pipe(takeUntil(this.destroy$)).subscribe(() => {
          this.attributeValueForm.reset();
          this.isEdit = false;
        });

      this.attributeValueForm.get('AttributeType')?.valueChanges.subscribe((type) => {
        this.attributeMasterService.getApplyToList(type).subscribe((res: any) => {
          if (res.status === 'ok') {
            this.applysTo = res.result;
          }
        });
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
              console.log(this.attributeValueList)
            }
          });
        }
      });

      this.attributeValueForm.get('AttributeName')?.valueChanges.subscribe((obj) => {
        this.attributeMasterService.getParentAttributeInfo(obj.AttributeListId).subscribe((res: any) => {
          if (res.status === 'ok') {
            this.ParentAttributeInfo = res?.result;
            if(this.ParentAttributeInfo.HasParent){
              this.hasParent = this.ParentAttributeInfo.HasParent;
              this.parentName = this.ParentAttributeInfo.ParentName;
              this.parentValueList = this.ParentAttributeInfo.ParentValues;
            }
            else {
              this.hasParent = false;
              this.parentName = '';
              this.parentValueList = [];
            }
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
        ApplyTo: ['', Validators.required],
        AttributeName: ['', Validators.required],
        // ParentAttribute: ['', Validators.required],
        AttributeValue:['', Validators.required],
        ParentAttributeValue:  ['', Validators.required],
      });
    }
  
    loadAttribute() {
      this.attributeMasterService.getAttributeTypes().subscribe((res: any) => {
        if (res.status === 'ok') this.attributeTypes = res.result;
      });
    }
  
    onSubmit() {
      
    }
    editAttribute(i: number){
      const item = this.attributeValueList[i];
  
       const selectedAttribute = this.attributeNames.find(
        attr => attr.AttributeListId === item.AttributeListId
      );
  
      const selectedParentValue = this.parentValueList.find(
        parent => parent.AttributeValueId === item.ParentAttributeValueId
      );
  
 
      this.attributeValueForm.patchValue({
        AttributeName: selectedAttribute,
        AttributeValue: item.AttributeValue,
        ParentAttributeValue: selectedParentValue
      });
  
      this.deleteAttribute(i);
    }

    deleteAttribute(i: number){
      this.attributeValueList.splice(i, 1);
    }
    AddAttribute(){
      const formValue = this.attributeValueForm.getRawValue();
      console.log(formValue);
      
      this.attributeValueList.push({
          AttributeListId: formValue.AttributeName.AttributeListId,
          AttributeName: formValue.AttributeName.attributeName,
          AttributeValue: formValue.AttributeValue,
          ParentAttributeName: this.parentName,
          ParentAttributeValueName: formValue.ParentAttributeValue.AttributeValue,
          ParentAttributeValueId: formValue.ParentAttributeValue.AttributeValueId,
      });
      console.log(this.attributeValueList);

      this.attributeValueForm.patchValue({
        AttributeName: '',
        AttributeValue: '',
        ParentAttributeValue: ''
      });
    }
}

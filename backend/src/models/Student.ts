import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import School from './School';
import sequelize from '../config/database';
import Class from './Class';
import Section from './Section';
import User from './User';



/* ===========================
   ENUMS (same file)
   =========================== */
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum BloodGroup {
  A_POS = 'A+',
  A_NEG = 'A-',
  B_POS = 'B+',
  B_NEG = 'B-',
  AB_POS = 'AB+',
  AB_NEG = 'AB-',
  O_POS = 'O+',
  O_NEG = 'O-',
  NA = 'NA',
}

export enum Religion {
  ISLAM = 'Islam',
  HINDUISM = 'Hinduism',
  CHRISTIANITY = 'Christianity',
  SIKHISM = 'Sikhism',
  BUDDHISM = 'Buddhism',
  JAINISM = 'Jainism',
  OTHER = 'Other'
}


class Student extends Model {
  public id!: number;
  public schoolId!: number; //Foreign Key
  public admissionNumber!: string;
  public admissionDate!: Date;
  public lastName!: string;
  public firstName!: string;
  public email?: string;
  public phone!: string;
  public dateOfBirth!: Date;
  public gender!: Gender;
  public bloodGroup!: BloodGroup;
  public religion!: Religion;
  public aadhaarNumber!: string;
  public classId!: number; //Foreign Key
  public sectionId!: number; //Foreign Key
  public rollNumber!: number;
  public address!: string;
  public city!: string;
  public state!: string;
  public pincode!: string;
  public fatherName!: string;
  public fatherPhone?: string;
  public fatherOccupation?: string;
  public motherName!: string;
  public motherPhone?: string;
  public motherOccupation?: string;
  public guardianName?: string;
  public guardianRelation?: string;
  public guardianPhone?: string;
  public fatherAadharNumber?: string;
  public studentPhoto?: string;
  public fatherPhoto?: string;
  public motherPhoto?: string;
  public guardianPhoto?: string;
  public dayboarding!: boolean;
  public hostel!: boolean;
  public areaTransportationId?: number; // Foreign Key to TransportationAreaPricing
  public createdBy!: number; //Foreign Key
  public paymentReminderDate?: Date; // Payment reminder date
  public paymentRemainderRemarks?: string; // Payment reminder remarks
  public active!: boolean; // Whether student is active (has not left school)

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual field for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

export const initStudentModel = (sequelize: Sequelize) => {
// Initialize model
Student.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    schoolId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: School,
        key: 'id',
      }
    },
    admissionNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Admission number is required',
        },
      },
    },
    admissionDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'First name is required',
        },
        len: {
          args: [1, 100],
          msg: 'First name must be between 1 and 100 characters',
        },
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Last name is required',
        },
        len: {
          args: [1, 100],
          msg: 'Last name must be between 1 and 100 characters',
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: {
          msg: 'Please provide a valid email',
        },
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: {
          args: [/^(\+91)?[6-9]\d{9}$/],
          msg: 'Phone number must be a valid Indian mobile number',
        },
      },
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isBefore: {
          args: new Date().toISOString().split('T')[0],
          msg: 'Date of birth must be in the past',
        },
      },
    },
    gender: {
      type: DataTypes.ENUM(...Object.values(Gender)),
      allowNull: false
    },
    bloodGroup: {
      type: DataTypes.ENUM(...Object.values(BloodGroup)),
      allowNull: false
    },
    religion: {
      type: DataTypes.ENUM(...Object.values(Religion)),
      allowNull: false,
    },
    aadhaarNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: {
          args: [/^[0-9]{12}$/],
          msg: 'Aadhaar number must be 12 digits',
        },
      },
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Class,
        key: 'id',
      }
    },
    sectionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Section,
        key: 'id',
      }
    },
    rollNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Address is required',
        }
      }
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'City is required',
        },
      },
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'State is required',
        },
      },
    },
    pincode: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: {
          args: [/^[0-9]{6}$/],
          msg: 'Pincode must be 6 digits',
        },
        notEmpty: {
          msg: 'Pincode is required',
        },
      },
    },
    fatherName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Father name is required',
        },
      },
    },
    fatherPhone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: {
          args: [/^(\+91)?[6-9]\d{9}$/],
          msg: 'Father phone must be a valid Indian mobile number',
        },
      },
    },
    fatherOccupation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    motherName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Mother name is required',
        },
      },
    },
    motherPhone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: {
          args: [/^(\+91)?[6-9]\d{9}$/],
          msg: 'Mother phone must be a valid Indian mobile number',
        },
      },
    },
    motherOccupation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    guardianName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    guardianRelation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    guardianPhone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: {
          args: [/^(\+91)?[6-9]\d{9}$/],
          msg: 'Guardian phone must be a valid Indian mobile number',
        }
      },
    },
    fatherAadharNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: {
          args: [/^[0-9]{12}$/],
          msg: 'Father Aadhaar number must be 12 digits',
        },
      },
    },
    studentPhoto: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    fatherPhoto: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    motherPhoto: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    guardianPhoto: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    dayboarding: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    hostel: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    areaTransportationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'transportation_area_pricing',
        key: 'id',
      },
      onUpdate: 'SET NULL',
      onDelete: 'SET NULL',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    paymentReminderDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    paymentRemainderRemarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    sequelize,
    modelName: 'Student',
    tableName: 'students',
    timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['schoolId', 'admissionNumber'],
      name: 'students_school_id_admission_number_unique',
    },
    {
      fields: ['schoolId', 'classId'],
      name: 'students_school_class_index',
    },
    {
      fields: ['schoolId'],
      name: 'students_school_index',
    },
  ],
  }
)
};

export default Student;

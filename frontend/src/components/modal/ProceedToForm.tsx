import { useState } from "react";
import { ModalType } from "../../types/type";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const ProceedToForm = ({ isOpen, handleIsOpen }: ModalType) => {
  const [isAgreed, setIsAgreed] = useState(false);
  const navigate = useNavigate();

  return (
    <AlertDialog open={isOpen} onOpenChange={handleIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Graduate Tracer Purpose</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              The Graduate Tracer Study aims to track the employment outcomes,
              career progression, and educational experiences of our graduates
              to improve our academic programs and services.
            </p>
            <div>
              <h4 className="font-semibold">Data Privacy Notice</h4>
              <p>
                In accordance with the Data Privacy Act of 2012 (RA 10173), we
                commit to protecting your personal information. By proceeding,
                you consent to the collection, processing, and storage of your
                data for the purposes of the Graduate Tracer Study. Your
                information will be kept confidential and will only be used for
                institutional research and development.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={isAgreed}
                onCheckedChange={(checked) => setIsAgreed(checked as boolean)}
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I have read and agree to the terms and conditions
              </label>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            className="bg-primary"
            onClick={() => {
              if (!isAgreed) {
                toast.error("Please check to agree the terms and conditions");
              } else {
                navigate("/form");
              }
            }}
          >
            Proceed
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ProceedToForm;

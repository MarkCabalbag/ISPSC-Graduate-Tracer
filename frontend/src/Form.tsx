import { Input } from "./components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./components/ui/select";
import { displayYears } from "./utils/utils";
import GeneralInformation from "./components/form/GeneralInformation";
import GraduateEmploymentInformation from "./components/form/GraduateEmploymentInformation";
import { useFormStore } from "./context/store";
import { useEffect, useState } from "react";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import { Toaster } from "react-hot-toast";

const years = displayYears(2020, 2080);

const Form = () => {
  const [email, setEmail] = useState("");
  const { handleEmailChange, handleSurveyChange } = useFormStore();

  useEffect(() => {
    handleEmailChange(email);
  }, [email]);

  return (
    <div className="min-h-screen bg-neutral-50 pb-16">
      <Navigation />
      {<Toaster />}
      <div className="w-[90%] max-w-[768px] mx-auto space-y-8 pt-8">
        <Header />

        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-4 border border-neutral-200 border-t-8 border-t-primary space-y-6">
          <div className="border-b border-neutral-100 pb-4">
            <h2 className="text-xl font-bold text-neutral-900">Graduate Tracer Survey Form</h2>
            <p className="text-sm text-neutral-500 mt-1">Please provide accurate details for your institutional record.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-neutral-700 block mb-2">Email Address</label>
              <Input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., student@ispsc.edu.ph"
                className="border-neutral-300 focus:border-primary focus:ring-primary h-11"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-neutral-700 block mb-2">
                Year of Survey
              </label>
              <Select onValueChange={(value) => handleSurveyChange(value)}>
                <SelectTrigger className="w-full border-neutral-300 focus:border-primary focus:ring-primary h-11">
                  <SelectValue placeholder="Select Year of Survey" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year: number) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-4 border border-neutral-200 border-t-8 border-t-primary">
          <GeneralInformation />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 border border-neutral-200 border-t-8 border-t-primary">
          <GraduateEmploymentInformation />
        </div>
      </div>
    </div>
  );
};

export default Form;
